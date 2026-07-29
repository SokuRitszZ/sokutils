# Cache

`@sokutils/cache` 提供类型安全的函数结果缓存，支持可配置的 key
生成器、缓存策略和持久化存储。

## 安装

```bash
pnpm add @sokutils/cache
```

## 使用指南

本文指导 AI 和开发者正确创建、选择和扩展 cache。实现约束见 [AGENTS.md](./AGENTS.md)。

## 推荐：使用 Builder

大多数调用方优先使用 `CacheBuild`。先设置 Function，再按需设置 KeyGenerator、Strategy 和 Storage，最后 Build：

```ts
import {
  CacheBuild,
  CachePresetStrategyLRU,
} from '@sokutils/cache';

const getUser = CacheBuild()
  .Function(async (id: string) => fetchUser(id))
  .KeyGenerator(id => id)
  .Strategy(CachePresetStrategyLRU(100))
  .Build();

const user = await getUser('user-1');
```

建议先调用 Function，再调用 KeyGenerator，这样 key 函数能获得正确的参数类型推断。Builder 的调用顺序不会改变运行时优先级，后一次同名配置会覆盖前一次。

### 复用 Builder 配置

Builder 的每次链式调用都会返回新的配置快照，不会修改原 builder。因此可以先创建一个共享配置模板，再为不同 Function 直接调用 Function + Build：

```ts
const reusableCacheBuilder = CacheBuild()
  .Strategy(CachePresetStrategyLRU(100));

const getUser = reusableCacheBuilder
  .Function((id: string) => fetchUser(id))
  .Build();

const getTeam = reusableCacheBuilder
  .Function((id: string) => fetchTeam(id))
  .Build();
```

两个 Build 会创建彼此独立的内存 context 和 valuesMap，后续修改某条 builder 链也不会影响其他链：

```ts
const onceBuilder = reusableCacheBuilder
  .Strategy(CachePresetStrategyOnce());

const lruCached = reusableCacheBuilder.Function(loadA).Build();
const onceCached = onceBuilder.Function(loadB).Build();
```

适合放进共享 builder 的配置：

- 通用 Strategy。
- 对所有目标函数都成立的默认 KeyGenerator。
- 确实需要共享同一持久化命名空间的 Storage。

需要注意：

- 不同 Function 参数结构不同时，分别在 Function 之后设置 KeyGenerator，以获得正确类型并避免 key 冲突。
- 复用同一个 LocalStorage/IDB Storage 实例意味着多个 cached function 使用同一个 Storage Key，可能互相读取或覆盖数据。需要隔离时，为每个 Function 创建不同 Key 的 Storage。
- Builder 配置可以复用，但 Build 后产生的 cached function 状态不能互换。

如果不设置额外选项，默认行为是：

- Function：空函数。
- Strategy：once。
- KeyGenerator：`JSON.stringify(params)`。
- Storage：无，仅保存在当前 wrapper 实例内存中。

## 直接使用 CacheCore

需要一次性明确所有配置时，可以直接使用 CacheCore：

```ts
import {
  CACHE_DEFAULT_KEY_GENERATOR,
  CacheCore,
  CachePresetStrategyTimeout,
} from '@sokutils/cache';

const cached = CacheCore({
  Function: (id: string) => loadValue(id),
  KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
  Strategy: CachePresetStrategyTimeout(30_000),
});
```

CacheCore 与 CacheBuild 都会保持原 Function 的参数类型。只有配置 AsyncLoad=true 的 Storage 时，同步 Function 才会被提升为返回 Promise 的函数。

## 选择 Strategy

| 需求 | Strategy |
| --- | --- |
| 每组参数只计算一次 | `CachePresetStrategyOnce()` |
| 每个 key 独立 TTL | `CachePresetStrategyTimeout(ms)` |
| 整个 cache 在同一时刻失效 | `CachePresetStrategyExpireAt(timestamp)` |
| 只保留最近使用的 N 个 key | `CachePresetStrategyLRU(capacity)` |

### Once

```ts
const cached = CacheBuild()
  .Function(expensiveFunction)
  .Strategy(CachePresetStrategyOnce())
  .Build();
```

同一 key 第一次调用 miss，以后一直 hit，直到 wrapper 被丢弃或持久化数据被替换。它没有主动失效 API。

### Timeout

```ts
const cached = CacheBuild()
  .Function(loadValue)
  .Strategy(CachePresetStrategyTimeout(5_000))
  .Build();
```

TTL 从最近一次 miss/重新计算时开始，cache hit 不会延长 TTL。边界 `elapsed === timeout` 仍然 hit。

### Expire At

```ts
const cached = CacheBuild()
  .Function(loadValue)
  .Strategy(CachePresetStrategyExpireAt(Date.now() + 60_000))
  .Build();
```

所有 key 共用一个绝对过期时间。过期后当前实现会让每次调用都 miss，而不是自动开始一个新的缓存周期。

### LRU

```ts
const cached = CacheBuild()
  .Function(loadValue)
  .Strategy(CachePresetStrategyLRU(100))
  .Build();
```

访问一个 key 会把它移动到最近使用端。超过容量后，最久未使用的 key 会从 context 和 valuesMap 中淘汰。传入正整数 capacity。

## 自定义 KeyGenerator

默认 JSON key 适合简单 JSON 参数。对象包含不稳定字段顺序、循环引用、Date/Map/Set、自定义 class，或只想按业务主键缓存时，应提供自己的 KeyGenerator：

```ts
const cached = CacheBuild()
  .Function((user: { id: string; locale: string }) => loadUser(user))
  .KeyGenerator(user => `${user.id}:${user.locale}`)
  .Build();
```

不要生成包含随机数、当前时间或调用次数的 key，否则相同输入无法命中。

## 使用 Local Storage

LocalStorage preset 是同步 Storage，需要显式传入 Storage-like 对象和 Zod schema：

```ts
import { z } from 'zod/v4-mini';
import {
  CacheBuild,
  CachePresetStorageLocalStorage,
  CachePresetStrategyOnce,
} from '@sokutils/cache';

const cached = CacheBuild()
  .Function((id: string) => loadName(id))
  .Strategy(CachePresetStrategyOnce())
  .Storage(CachePresetStorageLocalStorage({
    Key: 'user-name-cache',
    LocalStorageLike: window.localStorage,
    ContextValidationZod: z.record(z.string(), z.boolean()),
    ValueValidationZod: z.string(),
  }))
  .Build();
```

Context schema 必须匹配所选 Strategy。上例 once 的 context 是 `Record<string, boolean>`。Value schema 描述单个缓存值，而不是整个 values map。

LocalStorage 默认以 500ms debounce 同步写入。如果希望减少运行中写入，可以改为仅在浏览器 `beforeunload` 时同步，并通过 `WindowLike` 注入浏览器窗口对象：

```ts
CachePresetStorageLocalStorage({
  Key: 'user-name-cache',
  LocalStorageLike: window.localStorage,
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.string(),
  SyncMode: 'before-unload',
  WindowLike: window,
});
```

不要在包内部直接依赖 `window`。浏览器外或测试环境继续通过 `LocalStorageLike`、`WindowLike` 注入兼容对象；不传 `WindowLike` 时，Node 等非浏览器环境仍可创建 storage，但 `before-unload` 模式不会自动 flush。

LocalStorage 无法可靠序列化 Promise、函数、循环引用或复杂 class 实例，只持久化 JSON-safe 值。

## 使用 IndexedDB

IDB preset 是异步 Storage，因此即使原 Function 是同步函数，最终 cached function 也返回 Promise：

```ts
import { z } from 'zod/v4-mini';
import {
  CacheBuild,
  CachePresetStorageIDB,
  CachePresetStrategyLRU,
} from '@sokutils/cache';

const cached = CacheBuild()
  .Function((id: string) => loadName(id))
  .Strategy(CachePresetStrategyLRU(100))
  .Storage(CachePresetStorageIDB({
    Key: 'user-name-cache',
    ContextValidationZod: z.array(z.string()),
    ValueValidationZod: z.string(),
  }))
  .Build();

const value = await cached('user-1');
```

浏览器外使用时，通过 IDBFactory 注入兼容实现。Storage.Save 不会被 CacheCore await；需要“保存完成后才能继续”的强一致持久化时，当前 API 不满足要求。

为兼容从 `@sokutils/pure` 迁移前已经持久化的数据，IDB preset 继续使用
`@sokutils/pure` 作为内部数据库名。

## 自定义 Strategy

调用方可以通过 `CacheDefineStrategy` 定义命中和淘汰规则：

```ts
import {
  CacheBuild,
  CacheDefineStrategy,
} from '@sokutils/cache';

interface UseCountContext {
  [key: string]: number;
}

const CacheStrategyHitTwice = CacheDefineStrategy(() => ({
  InitContext: (): UseCountContext => ({}),
  Match: ({ CurrentContext, Key }) => {
    const count = CurrentContext[Key] ?? 0;
    return {
      Hit: count > 0,
      NextContext: {
        ...CurrentContext,
        [Key]: count + 1,
      },
    };
  },
}));

const cached = CacheBuild()
  .Function(loadValue)
  .Strategy(CacheStrategyHitTwice())
  .Build();
```

自定义 Strategy 必须返回完整 NextContext。需要淘汰 valuesMap 中的 key 时，同时返回 PickedKeys：

```ts
return {
  Hit,
  NextContext: nextContext,
  PickedKeys: Object.keys(nextContext),
};
```

`PickedKeys: []` 会清空全部缓存值。不要返回 Hit=true，除非该 key 已经有对应缓存值或由 Storage 正确载入。

## 自定义 Storage

通过 `CacheDefineStorage` 可以接入内存快照、文件、数据库或远端存储：

```ts
import { z } from 'zod/v4-mini';
import { CacheDefineStorage } from '@sokutils/cache';

const CacheStorageMemory = CacheDefineStorage((key: string) => {
  let snapshot: unknown;

  return {
    AsyncLoad: false,
    ContextValidationZod: z.record(z.string(), z.boolean()),
    ValueValidationZod: z.string(),
    Load: () => snapshot as any,
    Save: (Context, CachedValueMap) => {
      snapshot = { Context, CachedValueMap };
    },
  };
});
```

自定义 Storage 必须遵循：

- AsyncLoad 使用布尔字面量，不能是运行时不确定的 boolean。
- Load 返回 `undefined` 或 `{ Context, CachedValueMap }`。
- Context schema 与 Strategy context 一致。
- Value schema描述单个缓存值。
- 不依赖 Save 会被 await。
- 外部数据始终视为不可信，并通过 schema 校验。

## 异步函数与并发

CacheCore 当前缓存 async Function 返回的 Promise，而不是等待 Promise 成功后再写入：

```ts
const cached = CacheBuild()
  .Function(async (id: string) => fetchValue(id))
  .Build();
```

需要注意：

- 第一个 Promise pending 时，后续同 key 调用通常会复用该 Promise。
- Core 没有独立的 single-flight registry；是否复用 pending Promise 取决于 strategy 是否对后续调用返回 hit。
- 自定义 strategy 如果在 pending 期间持续返回 miss，会重复执行 Function。
- Promise rejection 不会自动清除缓存，后续调用可能继续得到同一个 rejected Promise。
- 不要把 pending Promise 持久化到 JSON Storage。

需要自动清除 rejection、single-flight 或 stale-while-revalidate 时，应先扩展 core 并补充并发测试，不要假设当前 API 已支持。

## 常见错误

- Function 参数是对象却直接依赖默认 JSON key，没有确认稳定性。
- Strategy context schema 与 Storage 的 ContextValidationZod 不匹配。
- ValueValidationZod 错写成整个 map 的 schema。
- Strategy 淘汰了 context key，却没有通过 PickedKeys 淘汰 valuesMap。
- 使用 async Storage 后仍把 cached function 当同步函数调用。
- 假设 Storage.Save 已完成或错误会传播给调用者。
- 假设 timeout 会在 hit 时续期。
- 假设 expire-at 过期后会自动开启新周期。
