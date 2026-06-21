# Lock 工厂模式 + 链式调用 + Strategy 设计报告

> 主题：`packages/pure` 中 lock 封装的 API 设计讨论  
> 范围：只讨论 **非抢占锁**；不讨论 preemptive / abort / 强制抢占  
> 当前目标：确认 `.strategy(...)` 的职责、类型和边界，再决定后续实现

---

## 结论摘要

推荐把 lock 设计成三层：

1. **Factory / Builder**：负责收集配置，提供链式 API。
2. **Strategy**：负责等待队列的调度规则，也就是“下一个 resolver 该选谁”。
3. **Built Lock**：由 `.build()` 生成，运行时就是一个可调用函数：`await lock(...)`。

推荐 API 形态：

```ts
const mutex = lock
  .create()
  .capacity(1)
  .strategy(lock.strategies.fifo())
  .build();

const unlock = await mutex();
unlock();
```

如果是优先级锁：

```ts
const priorityLock = lock
  .create<number>()
  .capacity(1)
  .strategy(lock.strategies.priority())
  .build();

const unlock = await priorityLock(10);
unlock();
```

核心建议：

- `.strategy(...)` 不应该直接“生成锁”。
- `.strategy(...)` 只注入调度策略。
- `.build()` 才真正生成运行时锁函数。
- lock 的本质仍然是：**Promise resolver + resolver pool + scheduler strategy**。
- strategy 应该只处理等待队列，不处理 `available/capacity/unlock` 这些锁生命周期逻辑。

---

## 1. 目标 API

用户希望：

- 工厂模式
- 链式调用
- 用 `.strategy(...)` 塞入策略
- 用 `.build()` 真正生成锁
- 锁定动作本身是函数调用，而不是对象方法

因此目标不是：

```ts
const mutex = lock.mutex();
const unlock = await mutex.lock();
```

而是：

```ts
const mutex = lock
  .create()
  .strategy(lock.strategies.fifo())
  .build();

const unlock = await mutex();
unlock();
```

也就是说，最终产物应该是 callable lock：

```ts
type BuiltLock<I = void> = (input?: I) => Promise<Unlock>;
```

---

## 2. 概念边界

### 2.1 Factory / Builder 负责什么

Builder 负责：

- 收集 capacity
- 收集 strategy
- 收集可选默认参数
- 最终 `.build()` 生成 lock runtime

示例：

```ts
const lockFn = lock
  .create<number>()
  .capacity(2)
  .strategy(lock.strategies.priority())
  .build();
```

Builder 不应该承担具体调度逻辑。

### 2.2 Strategy 负责什么

Strategy 负责等待队列的管理：

- waiter 怎么入队
- waiter 怎么出队
- 同优先级如何排序
- 是否 FIFO / LIFO / priority / deque / multilevel

Strategy 不应该负责：

- 当前还有几个 available permit
- unlock 是否 one-shot
- 当前 holder 是否释放
- Promise resolver 创建
- capacity 校验

这些应该属于 lock runtime。

### 2.3 Built Lock 负责什么

`.build()` 之后生成的 lock 负责运行时生命周期：

1. 调用 `lock(input)`。
2. 如果还有可用 permit，立即 resolve 一个 `unlock`。
3. 如果没有可用 permit，创建 waiter，把 resolver 交给 strategy 排队。
4. `unlock()` 时，从 strategy 取下一个 waiter。
5. 如果有 waiter，唤醒它。
6. 如果没有 waiter，归还 permit。

---

## 3. 推荐类型设计

### 3.1 基础类型

```ts
export type Unlock = () => void;

export type BuiltLock<I = void> = (input?: I) => Promise<Unlock>;
```

### 3.2 Waiter

```ts
type Waiter<I> = {
  input: I;
  order: number;
  resolve: (unlock: Unlock) => void;
};
```

说明：

- `input` 是本次加锁时传入的调度参数，比如 priority 或 deque direction。
- `order` 是 resolver pool 生成的全局递增序号，用于稳定排序。
- `resolve` 是唤醒 waiter 的 resolver。

### 3.3 Strategy

推荐 strategy 接口保持最小：

```ts
export type LockStrategy<I> = {
  enqueue(waiter: Waiter<I>): void;
  dequeue(): Waiter<I> | undefined;
};
```

这符合当前非抢占目标。

暂时不建议把 `capacity`、`available`、`unlock` 放进 strategy。否则 strategy 会从“调度策略”膨胀成“锁 runtime 插件”，边界会变混乱。

---

## 4. `.strategy(...)` 应该接受什么？

这里有三个候选方案。

### 方案 A：接受 strategy 实例

```ts
lock
  .create<number>()
  .strategy(lock.strategies.priority())
  .build();
```

其中：

```ts
lock.strategies.priority()
```

返回一个新的 strategy 实例。

优点：

- 直观
- 类型清晰
- 每个 lock 有独立 strategy 状态
- 不容易误共享队列

缺点：

- 用户需要记得调用 `priority()` 而不是传 `priority`

推荐程度：**最高**。

---

### 方案 B：接受 strategy factory

```ts
lock
  .create<number>()
  .strategy(lock.strategies.priority)
  .build();
```

`.build()` 内部再调用 factory。

优点：

- 避免用户复用同一个有状态 strategy 实例
- 每次 build 都能生成新 strategy

缺点：

- 类型稍微绕
- 不方便传 strategy 参数
- 如果 strategy 需要配置，会变成：

```ts
.strategy(() => lock.strategies.priority({ descending: false }))
```

推荐程度：**中等**。

---

### 方案 C：同时接受实例和 factory

```ts
type StrategyLike<I> = LockStrategy<I> | (() => LockStrategy<I>);
```

优点：

- 灵活

缺点：

- API 规则变复杂
- 类型错误和运行时歧义增加
- 用户会不清楚 strategy 是否可复用

推荐程度：**暂不推荐第一版使用**。

---

## 5. 推荐策略：`.strategy(strategyInstance)`

第一版建议明确：

```ts
.strategy(lock.strategies.fifo())
.strategy(lock.strategies.stack())
.strategy(lock.strategies.priority())
.strategy(lock.strategies.multilevelPriority())
.strategy(lock.strategies.deque())
```

也就是 `.strategy(...)` 接受一个 **已经创建好的 strategy 实例**。

为了避免误共享，文档可以明确：

> strategy 是有状态对象，包含等待队列。不要把同一个 strategy 实例传给多个 lock。需要多个 lock 时，请多次调用 `lock.strategies.xxx()`。

示例：

```ts
const strategy = lock.strategies.fifo();

const lockA = lock.create().strategy(strategy).build();
const lockB = lock.create().strategy(strategy).build(); // 不推荐
```

推荐：

```ts
const lockA = lock.create().strategy(lock.strategies.fifo()).build();
const lockB = lock.create().strategy(lock.strategies.fifo()).build();
```

---

## 6. Builder 类型设计

### 6.1 基础 builder

```ts
type LockBuilder<I = void> = {
  capacity(capacity: number): LockBuilder<I>;
  strategy<NextInput>(strategy: LockStrategy<NextInput>): LockBuilder<NextInput>;
  build(): BuiltLock<I>;
};
```

关键点：`.strategy<NextInput>()` 可以改变 builder 的 input 类型。

例如：

```ts
const mutex = lock
  .create()
  .strategy(lock.strategies.fifo())
  .build();

// mutex: () => Promise<Unlock>
```

```ts
const priorityLock = lock
  .create()
  .strategy(lock.strategies.priority())
  .build();

// priorityLock: (priority?: number) => Promise<Unlock>
```

---

### 6.2 是否需要 `.input()`？

暂时不需要。

因为 input 类型可以由 strategy 决定：

| Strategy | Input 类型 |
|---|---|
| `fifo()` | `void` |
| `stack()` | `void` |
| `priority()` | `number` |
| `multilevelPriority()` | `number` |
| `deque()` | `'front' | 'back'` |

这比让 builder 单独配置 input 更自然。

---

## 7. 默认值问题

部分 strategy 需要默认 input。

例如：

```ts
priorityLock();       // 默认 priority 是多少？
dequeLock();          // 默认 front 还是 back？
```

推荐默认值由 strategy 自己提供：

```ts
type LockStrategy<I> = {
  defaultInput: I;
  enqueue(waiter: Waiter<I>): void;
  dequeue(): Waiter<I> | undefined;
};
```

例如：

```ts
lock.strategies.priority({ defaultPriority: 0 })
lock.strategies.deque({ defaultDirection: 'back' })
```

这样 builder 不需要理解 priority/deque 的业务语义。

---

## 8. Strategy 是否应该纯函数化？

不建议第一版做成纯函数。

因为等待队列本身是状态：

```ts
const queue: Waiter<I>[] = [];
```

所以 strategy 天然是有状态对象。

可以把策略构造函数保持纯：

```ts
const fifo = () => {
  const queue: Waiter<void>[] = [];
  return {
    defaultInput: undefined,
    enqueue: waiter => queue.push(waiter),
    dequeue: () => queue.shift(),
  };
};
```

也就是说：

- strategy factory 是纯的
- strategy instance 是有状态的

这是比较清晰的边界。

---

## 9. 与现有快捷 API 的关系

工厂链式 API 可以作为底层标准接口。

快捷 API 可以只是 sugar：

```ts
lock.mutex = () =>
  lock
    .create()
    .capacity(1)
    .strategy(lock.strategies.fifo())
    .build();
```

```ts
lock.semaphore = (capacity: number) =>
  lock
    .create()
    .capacity(capacity)
    .strategy(lock.strategies.fifo())
    .build();
```

```ts
lock.priority = () =>
  lock
    .create<number>()
    .capacity(1)
    .strategy(lock.strategies.priority())
    .build();
```

这样可以同时保留：

- 高级用户可组合的 builder API
- 普通用户直接使用的快捷 API

---

## 10. 推荐最终形态

### 10.1 主入口

```ts
lock.create()
```

返回 builder。

### 10.2 策略集合

```ts
lock.strategies.fifo()
lock.strategies.stack()
lock.strategies.priority()
lock.strategies.multilevelPriority()
lock.strategies.deque()
```

### 10.3 快捷方法

```ts
lock.mutex()
lock.semaphore(capacity)
lock.priority()
lock.stack()
lock.multilevelPriority()
lock.deque()
```

快捷方法都基于 builder 实现。

---

## 11. 示例 API

### Mutex

```ts
const mutex = lock
  .create()
  .strategy(lock.strategies.fifo())
  .build();

const unlock = await mutex();
unlock();
```

### Semaphore

```ts
const sem = lock
  .create()
  .capacity(3)
  .strategy(lock.strategies.fifo())
  .build();

const release = await sem();
release();
```

### Priority Lock

```ts
const priorityLock = lock
  .create()
  .strategy(lock.strategies.priority({ defaultPriority: 0 }))
  .build();

const unlock = await priorityLock(10);
unlock();
```

### Stack Lock

```ts
const stack = lock
  .create()
  .strategy(lock.strategies.stack())
  .build();

const unlock = await stack();
unlock();
```

### Deque Lock

```ts
const deque = lock
  .create()
  .strategy(lock.strategies.deque({ defaultDirection: 'back' }))
  .build();

const unlock = await deque('front');
unlock();
```

---

## 12. 不建议第一版加入的东西

### 12.1 可抢占

当前用户已明确：暂时不看可抢占。

因此不要在第一版 builder / strategy 里加入：

- `AbortSignal`
- `Lease`
- `preempt`
- `deadline`
- `shouldPreempt`

这些会污染非抢占模型。

### 12.2 任务执行器

不建议第一版做：

```ts
lock.run(async () => {})
```

因为用户当前明确锁定动作是：

```ts
const unlock = await lock();
```

### 12.3 过度泛化插件系统

不要第一版就做：

```ts
.use(plugin)
.on('unlock', handler)
.on('enqueue', handler)
```

目前核心问题是 strategy 边界，不是插件生态。

---

## 13. 需要继续确认的问题

### 问题 1：`.strategy(...)` 是否只接受 instance？

推荐：只接受 instance。

```ts
.strategy(lock.strategies.priority())
```

不推荐第一版同时支持 factory。

### 问题 2：strategy 是否暴露 `defaultInput`？

推荐：暴露。

否则 builder 需要知道 priority/deque 的默认参数，职责会混乱。

```ts
type LockStrategy<I> = {
  defaultInput: I;
  enqueue(waiter: Waiter<I>): void;
  dequeue(): Waiter<I> | undefined;
};
```

### 问题 3：`.capacity(...)` 是 builder 的职责还是 strategy 的职责？

推荐：builder / runtime 职责。

原因：capacity 是 permit 数量，不是等待队列排序规则。

### 问题 4：strategy 是否允许复用？

推荐：不鼓励复用。

因为 strategy instance 内部有队列状态。

### 问题 5：`priority()` 和 `multilevelPriority()` 是否要分开？

如果实现上都能保证同优先级 FIFO，它们语义会接近。

可以考虑：

- `priority()`：概念简单，内部可以用数组扫描。
- `multilevelPriority()`：显式按 level 分桶，适合强调多级队列。

保留两个 API 没问题，但文档要说明差异主要在内部结构与语义表达。

---

## 14. 推荐决策

建议下一步确认以下设计：

```ts
type LockStrategy<I> = {
  defaultInput: I;
  enqueue(waiter: Waiter<I>): void;
  dequeue(): Waiter<I> | undefined;
};
```

`.strategy(...)` 接受 strategy instance：

```ts
.strategy(lock.strategies.priority())
```

`.build()` 生成 callable lock：

```ts
const unlock = await builtLock(input);
```

快捷方法只作为 sugar：

```ts
lock.mutex()
lock.semaphore(2)
lock.priority()
```

底层全部走：

```ts
lock.create().capacity(...).strategy(...).build()
```

---

## 15. 最终建议版 API 草案

```ts
const lockFn = lock
  .create<number>()
  .capacity(1)
  .strategy(lock.strategies.priority({ defaultPriority: 0 }))
  .build();

const unlock = await lockFn(10);

try {
  // critical section
}
finally {
  unlock();
}
```

这个设计满足：

- 工厂模式
- 链式调用
- `.strategy(...)` 注入策略
- `.build()` 真正生成锁
- 锁本身是函数
- strategy 只管调度
- runtime 只管 resolver、capacity、unlock 生命周期
- 后续可以扩展更多非抢占调度策略
