# Schedule 设计与维护约束

本目录实现一个非抢占式、Promise 驱动的任务调度器。修改实现或新增 preset 前，先遵守本文中的职责边界和不变量。

需要调用或组合现有 API 时，读取 [USAGE.md](./USAGE.md)。

## 核心模型

`ScheduleCore` 维护三个运行时集合：

- `PendingPool`：已经提交、尚未获得执行资格的 job meta。
- `ProcessingPool`：已经获得执行资格、尚未 unlock 的 job meta。
- resolver map：将 pending meta 映射到对应 Promise resolver。

调用流程：

1. `schedule(...input)` 调用 strategy 的 `Pend` 创建 meta。
2. Core 将 meta 放入 `PendingPool`。
3. 当 `ProcessingPool.size < JobCapacity` 时，core 调用 `Pick`。
4. 被选中的 meta 从 pending 移入 processing，并 resolve 对应 Promise。
5. 调用返回的 `unlock` 后，meta 从 processing 删除，core 重新调度。

`unlock` 通过 `es-toolkit/once` 保证 one-shot。业务代码应始终在 `finally` 中调用它：

```ts
const unlock = await schedule(input);
try {
  await work();
}
finally {
  unlock();
}
```

## 职责边界

Core 负责：

- 校验 `JobCapacity` 是正整数。
- 保证 `ProcessingPool.size <= JobCapacity`。
- 管理 pending/processing 状态迁移、Promise resolver 和 one-shot unlock。
- pool 发生变化时持续 Pick，直到容量已满或 strategy 返回 `undefined`。

Strategy 只负责：

- `Pend(...input)`：为一次调用创建新的 meta 对象。
- `Pick({ PendingPool, ProcessingPool })`：选择一个当前可执行的 pending meta。

不要在普通排序 strategy 中重复判断 `ProcessingPool.size`；并发数量由 `JobCapacity` 统一控制。Semaphore 可以读取 `ProcessingPool` 计算 weighted capacity，但不负责 job 数量上限。

不要重新引入 `Context`、`InitContext`、`FinishOne` 或 `NextContext`。当前两个 pool 已是调度状态的唯一事实来源。

## Strategy 不变量

- `Pend` 每次必须返回具有唯一对象 identity 的新 meta；复用同一对象会破坏 Set 和 resolver map。
- `Pick` 只能返回当前 `PendingPool` 中的对象，不能复制 meta 或构造新对象。
- 没有可执行任务时返回 `undefined`。
- `Set` 保持插入顺序；`minBy`/`maxBy` 比较值相同时保留第一个元素，因此自然形成同级 FIFO。
- Core 只在 job 提交、选中或 unlock 引起 pool 变化时调度。仅仅经过时间不会触发 Pick。
- 当前模型不支持强制抢占、暂停/恢复、取消、自动超时或定时唤醒。

## Preset 语义

| Preset | 输入 | 选择规则 |
| --- | --- | --- |
| `fifo` | 无 | 最早进入 pending 的 job |
| `lifo` | 无 | 最晚进入 pending 的 job |
| `priority` | `priority = 0` | 数值越大越优先；同值 FIFO |
| `deque` | `'front' \| 'back'`，默认 back | 最后加入的 front 优先；没有 front 时选择最早的 back |
| `semaphore` | `used` | 选择第一个 `used <= available` 的 job；允许小 job 绕过暂时无法满足的大 job |
| `shortest-job-first` | `cost` | cost 越小越优先；同值 FIFO |
| `deadline` | 数字 deadline | deadline 越小越优先；同值 FIFO；不会自行设置唤醒 timer |
| `aging-priority` | `priority = 0` | 有效值为 `priority + floor(waited / AgingInterval)`，越大越优先 |
| `random` | 无 | 随机选择；测试时通过 `Random` 注入 `[0, 1)` 随机源 |

补充约束：

- Semaphore 的构造 `capacity` 必须是正整数；当前不校验单次 `used`。
- Semaphore 的资源 capacity 与 core 的 `JobCapacity` 是两个独立限制：前者限制 used 总量，后者限制同时 processing 的 job 数量。
- Aging priority 默认 `AgingInterval = 1000ms`、`Now = Date.now`。时间流逝只会在下一次 pool 变化触发 Pick 时重新计算优先级。
- `mutex` 已由 `JobCapacity: 1 + fifo` 表达，不要恢复重复 preset。
- `multilevel-priority` 与当前 priority 没有行为差异，不要恢复重复 preset。

## 新增或修改 Preset

1. 将该 preset 专用的 `Meta`、`Input` 和 options 类型维护在自己的文件中；`types.ts` 只存放 core 通用类型。
2. 使用 `ScheduleDefineStrategy` 声明完整泛型，让最终 schedule 调用参数可正确推断。
3. 优先使用 `es-toolkit` 的 `head`、`last`、`minBy`、`maxBy`、`sumBy`、`sample` 等已有工具。
4. 将 preset 从 `preset/index.ts` 导出。
5. 为排序方向、同值顺序、默认输入、非抢占行为和非法 options 添加测试。
6. 时间或随机相关策略必须支持依赖注入，确保测试可重复。

## 测试约束

- 不使用随机 sleep、真实延时或概率性断言。
- 使用 `test-utils.ts` 中的 deferred、microtask flush 和 barrier 精确控制时序。
- 对等待状态先 flush microtasks，再断言 Promise 尚未获得执行资格。
- 每个测试清理所有已获得的 unlock，避免残留 processing job。
- Core 测试覆盖容量上限、pool 状态迁移、连续 Pick、实例隔离、非法 JobCapacity 和重复 unlock。

运行验证：

```bash
pnpm --filter @sokutils/pure exec vitest run src/schedule
pnpm --filter @sokutils/pure exec vitest run
```
