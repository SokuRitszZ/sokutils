# Schedule 使用指南

本文用于指导 AI 和开发者正确选择并调用 schedule。设计约束和扩展规则见 [AGENTS.md](./AGENTS.md)。

## 基本用法

`ScheduleCore` 返回一个可调用的 schedule 函数。调用 schedule 不会自动执行任务，而是等待获得执行资格，并返回对应的 `unlock`。

```ts
import {
  ScheduleCore,
  SchedulePresetStrategyFifo,
} from './schedule';

const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: SchedulePresetStrategyFifo(),
});

async function runJob() {
  const unlock = await schedule();
  try {
    await doWork();
  }
  finally {
    unlock();
  }
}
```

始终在 `finally` 中 unlock。忘记 unlock 会永久占用一个 processing slot，并可能阻塞后续任务。重复 unlock 是安全的，但不要依赖重复调用。

`JobCapacity` 是同时处于 ProcessingPool 的最大 job 数，必须是正整数：

```ts
const schedule = ScheduleCore({
  JobCapacity: 8,
  Strategy,
});
```

下文片段省略重复的 import 和 `try/finally`；真正执行 job 时始终遵循上面的 unlock 模式。

当前 `schedule` 尚未从 `packages/pure/src/index.ts` 导出。仓库内部应从实际的 schedule 入口或相对路径导入；不要虚构 `@sokutils/pure/schedule` 子路径。需要公开给包消费者时，先显式设计并补充 package export。

## 如何选择 Preset

| 需求 | 选择 |
| --- | --- |
| 按提交顺序执行 | `fifo` |
| 新任务优先于旧任务 | `lifo` |
| 调用方提供业务优先级 | `priority` |
| 单次请求决定插到队首或队尾 | `deque` |
| 每个任务消耗不同数量的共享资源 | `semaphore` |
| 已知预计执行成本，短任务优先 | `shortest-job-first` |
| 越接近截止时间越优先 | `deadline` |
| 需要 priority，同时降低低优先级饥饿风险 | `aging-priority` |
| 无业务顺序，只需随机打散 | `random` |

一个 ScheduleCore 当前只能使用一个 strategy。不要假设可以直接组合 priority 与 semaphore、deadline 与 aging 等多个 preset；这需要先设计组合 strategy 或扩展 core。

## 自定义 Strategy

调用方不局限于内置 presets，可以通过 `ScheduleDefineStrategy` 定义自己的调度规则。Strategy 负责把调用参数转换成 meta，并从 PendingPool 中选择下一个 job：

```ts
import { maxBy } from 'es-toolkit';
import {
  ScheduleCore,
  ScheduleDefineStrategy,
} from './schedule';

interface ScoreMeta {
  score: number;
}

type ScoreInput = [score: number];

const ScheduleStrategyScore = ScheduleDefineStrategy<
  [],
  ScoreMeta,
  ScoreInput
>(() => ({
  Pend: score => ({ score }),
  Pick: ({ PendingPool }) => maxBy(
    [...PendingPool],
    meta => meta.score,
  ),
}));

const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: ScheduleStrategyScore(),
});

const unlock = await schedule(100);
try {
  await doWork();
}
finally {
  unlock();
}
```

自定义 strategy 必须遵守：

- `Pend` 每次返回新的 meta 对象，不能复用对象 identity。
- `Pick` 只能返回当前 PendingPool 中的原始 meta；没有可执行 job 时返回 `undefined`。
- 不要重复判断 processing job 数量，`JobCapacity` 已由 core 统一执行。
- 可以读取 ProcessingPool 实现 weighted resource、互斥 key 等额外准入条件。
- Strategy 不会收到定时回调；返回 `undefined` 后，只有 pool 再次变化才会重新 Pick。
- 专用 Meta、Input 和 options 类型应与 strategy 放在同一个模块中。
- 为自定义排序方向、同值顺序、默认值和阻塞条件添加确定性测试。

## FIFO 与 LIFO

FIFO 适合作为默认公平队列；LIFO 适合优先处理最新状态、旧任务可以被覆盖或延后的场景。

```ts
const fifo = ScheduleCore({
  JobCapacity: 4,
  Strategy: SchedulePresetStrategyFifo(),
});

const lifo = ScheduleCore({
  JobCapacity: 1,
  Strategy: SchedulePresetStrategyLifo(),
});

const fifoUnlock = await fifo();
const lifoUnlock = await lifo();
fifoUnlock();
lifoUnlock();
```

`JobCapacity: 1 + fifo` 就是互斥 FIFO 队列，不要寻找或恢复单独的 mutex preset。

## Priority

Priority 的数值越大，优先级越高；不传时默认为 `0`。相同 priority 保持 FIFO。

```ts
const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: SchedulePresetStrategyPriority(),
});

const unlock = await schedule(100);
```

Priority 不会抢占已经进入 ProcessingPool 的任务。高优先级请求只能在出现空闲 slot 后优先获得资格。

## Deque

Deque 允许每次提交选择 `front` 或 `back`，默认是 `back`：

```ts
const schedule = ScheduleCore({
  JobCapacity: 1,
  Strategy: SchedulePresetStrategyDeque(),
});

const defaultBackUnlock = await schedule(); // 等同于 back
defaultBackUnlock();

const backUnlock = await schedule('back');
backUnlock();

const frontUnlock = await schedule('front');
frontUnlock();
```

等待队列中最后提交的 front 请求最先执行；没有 front 时，最早的 back 请求先执行。它同样不会抢占 processing job。

## Semaphore

Semaphore 同时受到两个容量限制：

- `JobCapacity`：processing job 数量上限。
- semaphore `capacity`：processing job 的 `used` 总量上限。

```ts
const schedule = ScheduleCore({
  JobCapacity: 4,
  Strategy: SchedulePresetStrategySemaphore(10),
});

const unlock = await schedule(3); // 当前 job 占用 3 个资源单位
```

Semaphore 使用 first-fit：按插入顺序寻找第一个当前 `used <= available` 的 job。因此小 job 可以绕过暂时无法满足的大 job。构造 capacity 必须是正整数；当前调用方需要自行保证 used 合法。

## Shortest Job First

调用时传入预计 cost，数值越小越优先；相同 cost 保持 FIFO。

```ts
const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: SchedulePresetStrategyShortestJobFirst(),
});

const unlock = await schedule(estimatedCost);
```

只在调用方能提供有意义且尺度一致的 cost 时使用。持续到来的短任务可能让大任务饥饿；需要缓解饥饿时考虑 aging priority。

## Deadline

调用时传入数字 deadline，数值越小越优先；推荐统一使用 Unix 毫秒时间戳。

```ts
const schedule = ScheduleCore({
  JobCapacity: 1,
  Strategy: SchedulePresetStrategyDeadline(),
});

const unlock = await schedule(Date.now() + 5_000);
```

Deadline 只决定出现空闲 slot 时的选择顺序，不会创建 timer、自动取消过期任务或抢占 processing job。

## Aging Priority

Aging priority 使用基础 priority 加等待时间增益，兼顾业务优先级与等待公平性：

```ts
const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: SchedulePresetStrategyAgingPriority({
    AgingInterval: 1_000,
  }),
});

const unlock = await schedule(10);
```

每等待一个完整 AgingInterval，有效 priority 增加 1。默认 AgingInterval 是 1000ms。时间经过本身不会触发调度，只有下次 pool 变化调用 Pick 时才会重新计算。

测试时注入 clock，不要使用真实等待：

```ts
let now = 0;
const strategy = SchedulePresetStrategyAgingPriority({
  AgingInterval: 1_000,
  Now: () => now,
});
```

## Random

Random 适合没有业务顺序、希望打散等待任务的场景：

```ts
const schedule = ScheduleCore({
  JobCapacity: 2,
  Strategy: SchedulePresetStrategyRandom(),
});
```

生产环境默认使用 `es-toolkit/sample`。测试时注入返回 `[0, 1)` 的随机源：

```ts
const strategy = SchedulePresetStrategyRandom({
  Random: () => 0.5,
});
```

不要写依赖概率的 UT。

## 常见错误

- 不要忘记 unlock，也不要只在成功分支 unlock。
- 不要把 `JobCapacity` 当作 weighted resource capacity；weighted 场景使用 semaphore。
- 不要认为高 priority、front 或更早 deadline 会抢占 processing job。
- 不要认为 deadline、aging 或 random 会自动产生新的调度事件。
- 不要复用 strategy `Pend` 返回的 meta 对象。
- 不要在业务层读取或修改 PendingPool/ProcessingPool；它们只提供给 strategy。
- 不要使用随机 sleep 验证调度顺序；使用受控 Promise 和依赖注入。
