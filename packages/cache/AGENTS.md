# Cache 设计与维护约束

本目录实现函数结果缓存。修改 core、builder、strategy 或 storage 前，先遵守本文中的职责边界和不变量。需要调用现有 API 或自定义扩展时，读取 [README.md](./README.md)。

## 核心模型

`CacheCore` 包装一个 Function，并维护：

- `context`：由 Strategy 独占解释的调度/命中状态。
- `valuesMap`：`cache key -> function result`。
- 可选 Storage：持久化 `{ Context, CachedValueMap }`。

每次调用流程：

1. 首次调用通过 `once` 执行 Storage.Load；没有 Storage 或载入失败时初始化空状态。
2. KeyGenerator 根据函数参数生成 key。
3. Strategy.Match 返回 `Hit`、`NextContext` 和可选 `PickedKeys`。
4. Hit 时直接读取 valuesMap；miss 时调用原 Function 并写入 valuesMap。
5. 更新 context；若存在 PickedKeys，则只保留这些 key 对应的缓存值。
6. 调用 Storage.Save 保存最新状态。

清除缓存工具流程：

- `CleanCache(...params)` 使用同一个 KeyGenerator 生成 key，只删除对应 valuesMap 项。
- `CleanAllCache()` 删除全部 valuesMap 项。
- 两者都会确保首次 Storage.Load 已执行；配置 Storage 时，删除后调用 Storage.Save 保存当前 context 和 valuesMap。
- 两者不重置 Strategy context，也不等待异步 Storage 的载入或保存完成。

## 职责边界

Core 负责：

- Function 包装、key 生成、value 读写和类型保持。
- Storage 的一次性载入、Zod 校验、fallback 初始化和保存调用。
- 应用 Strategy 返回的 NextContext 与 PickedKeys。

Strategy 负责：

- `InitContext`：生成全新的初始 context。
- 提供 `ContextValidationZod` 校验持久化载入的 context。
- `Match`：根据 Key、Params 和 CurrentContext 判断是否 hit。
- 返回完整 NextContext。
- 通过 PickedKeys 明确通知 core 应保留哪些缓存值。

Storage 负责：

- 声明 `AsyncLoad`，该字面量决定包装函数的返回类型。
- 提供 `ValueValidationZod` 校验单个缓存值。
- Load/Save `{ Context, CachedValueMap }`，不解释 strategy 语义。

Builder 只负责以链式 API 收集 Function、Strategy、KeyGenerator 和 Storage，最终 Build 时调用 CacheCore。每次配置调用都会返回新的 builder 快照，因此已配置的 builder 可以作为模板复用；每次 Build 都会创建独立的 CacheCore 运行时状态。

## 不变量与已知边界

- Strategy 的 context 与 valuesMap 必须保持一致。Strategy 返回 Hit=true 时，对应 key 应存在于 valuesMap；否则 core 会返回 `undefined` 的类型断言值。
- PickedKeys 会过滤 valuesMap，但不会自动修改 NextContext。Strategy 必须同时返回一致的 context。
- InitContext 每次必须返回新对象或新数组，不要共享可变默认值。
- KeyGenerator 必须稳定且只由参数决定。默认实现是 `JSON.stringify(params)`，复杂对象、循环引用或需要跨进程稳定性时应自定义。
- Storage.Load 只执行一次。AsyncLoad=true 时，首次和后续调用都会返回 Promise 类型。
- Storage.Save 的返回值不会被 await；当前持久化是 fire-and-forget。
- 多个 Build 默认拥有独立的内存 context 和 valuesMap；如果复用同一个 Storage 实例，它们仍会读写相同的持久化 Key，可能互相覆盖。
- CacheCore 没有独立的 in-flight/single-flight registry。默认 once 等 strategy 通常会复用已写入 valuesMap 的 pending Promise，但自定义 strategy 若持续返回 miss，仍会重复执行 Function。
- async Function 返回的 Promise 会立即进入 valuesMap。Rejected Promise 不会自动移除，可能被后续 hit 重用。
- Function 同步抛错时不会更新 value、context 或 Storage。
- 公开的清理 API 只有 `CleanCache` 和 `CleanAllCache`；当前没有 stale-while-revalidate API。

## 内置 Strategy 语义

| Strategy | 语义 |
| --- | --- |
| `once` | 每个 key 首次 miss，之后永久 hit |
| `timeout` | 每个 key 从最近一次 miss 开始计时；hit 不续期 |
| `expire-at` | 所有 key 共用绝对过期时间；过期后每次调用都 miss |
| `lru` | 最近使用的 key 保留在容量窗口中；访问会移动到末尾 |

补充约束：

- Timeout 在 `now - timestamp <= timeout` 时 hit。
- ExpireAt 在 `Date.now() > expireAt` 后失效，并通过空 PickedKeys 清空 valuesMap。
- LRU 的 PickedKeys 等于 NextContext；新增校验前，调用方应传正整数容量。

## 内置 Storage 语义

- `local-storage`：同步 Load；要求显式传入 Storage-like 对象；使用 JSON 序列化；默认 debounce 保存，也支持 before-unload。
- `idb`：异步 Load；默认使用 globalThis.indexedDB，也支持注入 IDBFactory；数据库名与 object store 名由实现固定，Key 区分缓存记录；默认 debounce 保存，也支持 best-effort before-unload。
- 两种 storage 遇到缺失、无法解析或不符合格式的 payload 时都返回 undefined，core 回退到新状态。
- Core 会使用 Strategy 的 ContextValidationZod 与 Storage 的 ValueValidationZod 校验载入内容。

## 扩展约束

1. 新 Strategy 使用 `CacheDefineStrategy`，提供匹配 Context 类型的 ContextValidationZod，并将专用 Context、options 类型维护在自己的文件中。
2. Match 不要直接修改 CurrentContext；返回新的 NextContext。
3. 淘汰值时同时返回与 NextContext 一致的 PickedKeys。
4. 新 Storage 使用 `CacheDefineStorage`，AsyncLoad 必须是 `true` 或 `false` 字面量。
5. Storage payload 保持 `{ Context, CachedValueMap }`，并使用现有 Zod schema 做外层验证。
6. 优先使用 `es-toolkit` 和现有 `unwrap` 等工具，不重复实现通用操作。

## 测试约束

- Strategy 同时测试直接 Match 状态迁移和 CacheCore 集成行为。
- 时间相关测试使用 `vi.useFakeTimers()` 与 `vi.setSystemTime()`，不等待真实时间。
- Storage 测试注入 MemoryStorage 或 fake-indexeddb，不依赖宿主环境真实数据。
- 覆盖有效载入、缺失数据、无效 JSON/schema、sync/async 类型推断。
- 测试 key 淘汰时，验证被淘汰 key 会重新调用 Function。
- 不修改或复用用户机器上的 localStorage/IndexedDB 数据。

运行验证：

```bash
pnpm --filter @sokutils/cache exec vitest run src
pnpm --filter @sokutils/cache exec vitest run
```
