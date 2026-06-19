# 可抢占锁（Preemptive Lock）设计讨论报告

## 结论摘要

在 TypeScript / JavaScript 里，所谓“可抢占锁”不应理解为强制中断当前正在执行的同步代码。JS 没有安全的线程级抢占能力，也无法打断正在阻塞 event loop 的同步任务。

更现实、可控的实现方式是：**协作式抢占（cooperative preemption）**。

也就是说：

1. 当前持锁者拿到的不只是 `unlock`，而是一个 `lease`。
2. `lease` 内包含 `unlock`、`AbortSignal`、优先级、抢占状态等信息。
3. 当更高优先级请求到来时，锁不会强行夺走执行权，而是通知当前 holder：你被抢占了。
4. 当前 holder 在业务代码的可中断点检查 `signal`，主动清理并释放锁。
5. 高优先级 waiter 在当前 holder 释放后获得锁。

推荐新增独立 API，而不是改动现有普通锁：

```ts
const lock = preemptivePriorityLock();

const lease = await lock(10);

try {
  await work(lease.signal);
}
finally {
  lease.unlock();
}
```

---

## 1. 为什么不能真正强制抢占？

JS 的执行模型决定了：

```ts
const lease = await lock(10);
while (true) {}
```

这种代码会直接卡死 event loop。任何新的高优先级请求、`AbortSignal`、timer、Promise continuation 都没有机会执行。

所以 JS 中的抢占只能发生在：

- `await` 边界
- 显式检查点
- 支持 `AbortSignal` 的异步 API
- worker / task runtime 层面

因此，“可抢占锁”的本质更接近：

> 带优先级和取消通知能力的协作式调度器。

---

## 2. 推荐语义

### 非抢占锁

现有锁继续保持简单：

```ts
const unlock = await lock(priority);
try {
  // critical section
}
finally {
  unlock();
}
```

它的语义是：

- 一旦获得锁，不会被打断
- 新来的高优先级请求只能影响等待队列顺序
- 当前 holder 必须主动 `unlock`

### 可抢占锁

新增 API：

```ts
const lease = await preemptiveLock(priority);
try {
  await task(lease.signal);
}
finally {
  lease.unlock();
}
```

它的语义是：

- 当前 holder 不会被强制终止
- 更高优先级请求到来时，当前 holder 的 `AbortSignal` 被触发
- 当前 holder 在可中断点响应 abort
- 当前 holder 释放后，高优先级 waiter 获得锁

---

## 3. 建议 API

### Lease 类型

```ts
export type PreemptiveLease<P = number> = {
  unlock: () => void;
  signal: AbortSignal;
  priority: P;
  preempted: () => boolean;
  throwIfPreempted: () => void;
};
```

### Lock 类型

```ts
export type PreemptivePriorityLock = (
  priority?: number,
) => Promise<PreemptiveLease<number>>;
```

### 使用示例

```ts
const pLock = lock.preemptivePriority();

const lease = await pLock(10);

try {
  for (const chunk of chunks) {
    lease.throwIfPreempted();

    await processChunk(chunk, {
      signal: lease.signal,
    });
  }
}
finally {
  lease.unlock();
}
```

---

## 4. 内部模型

可以沿用当前 “Promise resolver + resolver 池子 + 调度策略” 的设计。

普通非抢占锁里，waiter 可以是：

```ts
type Waiter<T> = {
  input: T;
  order: number;
  resolve: (unlock: Unlock) => void;
};
```

可抢占锁需要增加当前 holder 的状态：

```ts
type Holder<P> = {
  priority: P;
  order: number;
  controller: AbortController;
  lease: PreemptiveLease<P>;
};
```

waiter 则变成：

```ts
type PreemptiveWaiter<P> = {
  priority: P;
  order: number;
  resolve: (lease: PreemptiveLease<P>) => void;
};
```

调度器增加一个判断：

```ts
type PreemptiveScheduler<P> = {
  enqueue: (waiter: PreemptiveWaiter<P>) => void;
  dequeue: () => PreemptiveWaiter<P> | undefined;
  shouldPreempt: (holder: Holder<P>, waiter: PreemptiveWaiter<P>) => boolean;
};
```

对于数字优先级，可以约定：**数字越小，优先级越高**。

```ts
shouldPreempt(holder, waiter) {
  return waiter.priority < holder.priority;
}
```

---

## 5. 抢占流程

假设当前 holder 优先级是 `10`，新请求优先级是 `1`。

流程：

1. 新请求进入 `preemptiveLock(1)`。
2. 当前锁被占用。
3. 调度器判断：`1 < 10`，应该抢占。
4. 当前 holder 的 `AbortController` 被 abort。
5. 新请求进入等待队列的高优先级位置。
6. 当前 holder 在业务代码中检查到 abort。
7. 当前 holder 清理资源，并调用 `lease.unlock()`。
8. 调度器唤醒高优先级 waiter。
9. 高优先级 waiter 获得新的 lease。

关键点：

> 抢占只负责通知和重排队，不负责强杀当前执行流。

---

## 6. 可选策略

### 6.1 Soft Preempt

只通知当前 holder：

```ts
holder.controller.abort(new PreemptedError());
```

然后等待 holder 自己释放。

这是最安全的默认策略。

### 6.2 Deadline Preempt

通知当前 holder 后给一个宽限期：

```ts
holder.controller.abort(new PreemptedError({ deadline: 100 }));
```

如果超时仍未释放，可以：

- 触发 warning hook
- 标记 lock unhealthy
- 记录诊断信息
- 继续等待

但仍然不建议强行释放锁，因为这会破坏临界区一致性。

### 6.3 Auto-Requeue

当前 holder 被抢占后自动重新入队。

这需要锁管理的不只是获取/释放，还要管理任务函数：

```ts
await scheduler.run(priority, async (lease) => {
  // task body
});
```

这种模式已经更像 task scheduler，而不是 lock。

---

## 7. 为什么建议单独 API？

不建议把现有普通锁的返回值从 `unlock` 改成 `lease`，因为会让简单场景变复杂。

建议保留：

```ts
lock.priority(); // 非抢占，返回 unlock
```

新增：

```ts
lock.preemptivePriority(); // 可抢占，返回 lease
```

这样 API 语义更清晰：

| API | 返回值 | 语义 |
|---|---|---|
| `lock.priority()` | `unlock` | 非抢占优先队列锁 |
| `lock.preemptivePriority()` | `lease` | 协作式可抢占优先级锁 |

---

## 8. 最小实现建议

第一版只实现：

```ts
lock.preemptivePriority()
```

行为：

- 数字越小优先级越高
- 高优先级请求不会直接获得锁
- 高优先级请求会 abort 当前低优先级 holder
- 当前 holder `unlock()` 后，高优先级 waiter 优先获得锁
- 同优先级 FIFO
- `unlock()` one-shot，重复调用忽略

### 推荐测试覆盖

1. 低优先级 holder 正在持锁，高优先级请求到来后，低优先级 holder 的 signal 被 abort。
2. 高优先级请求不会立即进入临界区，证明非强制抢占。
3. 当前 holder unlock 后，高优先级 waiter 先获得锁。
4. 同优先级 FIFO。
5. 重复 unlock 不重复释放。
6. holder 不响应 signal 时，高优先级请求一直等待。

---

## 9. 风险与边界

### 9.1 同步死循环无法抢占

```ts
while (true) {}
```

这种情况无法处理。

### 9.2 临界区需要业务自己保证一致性

被 abort 的任务可能已经修改了一部分状态。

业务代码需要在 `finally` 或 catch 中清理：

```ts
try {
  await work(lease.signal);
}
catch (error) {
  if (lease.preempted()) {
    await rollback();
  }
  throw error;
}
finally {
  lease.unlock();
}
```

### 9.3 可抢占更像调度器

如果未来要支持：

- 自动恢复
- 自动重试
- time slicing
- deadline
- aging
- starvation prevention

那就应该考虑抽象成 `scheduler`，而不是继续塞进 `lock`。

---

## 10. 推荐下一步

建议不要马上修改现有 `lock.priority()`。

推荐新增：

```ts
lock.preemptivePriority()
```

第一版只做协作式抢占：

```ts
const pLock = lock.preemptivePriority();
const lease = await pLock(10);

try {
  await work(lease.signal);
}
finally {
  lease.unlock();
}
```

内部仍然基于：

- resolver pool
- current holder
- priority scheduler
- `AbortController`

这样既符合 JS 的能力边界，也不会破坏普通锁的简洁 API。
