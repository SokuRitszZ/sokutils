export type Unlock = () => void;
export type Release = Unlock;
export type Lock = () => Promise<Unlock>;
export type Mutex = Lock;
export type Semaphore = Lock;
export type PriorityLock = (priority?: number) => Promise<Unlock>;
export type StackLock = Lock;
export type MultilevelPriorityLock = (priority?: number) => Promise<Unlock>;
export type DequeDirection = 'front' | 'back';
export type DequeLock = (direction?: DequeDirection) => Promise<Unlock>;

type Resolver = (unlock: Unlock) => void;

interface Waiter<T> {
  input: T;
  order: number;
  resolve: Resolver;
}

interface Scheduler<T> {
  enqueue: (waiter: Waiter<T>) => void;
  dequeue: () => Waiter<T> | undefined;
}

class ResolverPool<T> {
  #order = 0;

  create(input: T): [Promise<Unlock>, Waiter<T>] {
    let resolve: Resolver | undefined;
    const promise = new Promise<Unlock>((innerResolve) => {
      resolve = innerResolve;
    });

    return [
      promise,
      {
        input,
        order: this.#order++,
        resolve: resolve as Resolver,
      },
    ];
  }
}

const validateCapacity = (capacity: number) => {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new TypeError('Lock capacity must be a positive integer');
  }
};

const fifoScheduler = <T>(): Scheduler<T> => {
  const queue: Waiter<T>[] = [];

  return {
    enqueue: waiter => queue.push(waiter),
    dequeue: () => queue.shift(),
  };
};

const stackScheduler = <T>(): Scheduler<T> => {
  const queue: Waiter<T>[] = [];

  return {
    enqueue: waiter => queue.push(waiter),
    dequeue: () => queue.pop(),
  };
};

const priorityScheduler = (): Scheduler<number> => {
  const queue: Waiter<number>[] = [];

  return {
    enqueue: waiter => queue.push(waiter),
    dequeue: () => {
      let bestIndex = 0;

      for (let index = 1; index < queue.length; index += 1) {
        const candidate = queue[index];
        const best = queue[bestIndex];

        if (candidate.input < best.input || (candidate.input === best.input && candidate.order < best.order)) {
          bestIndex = index;
        }
      }

      return queue.splice(bestIndex, 1)[0];
    },
  };
};

const multilevelPriorityScheduler = (): Scheduler<number> => {
  const levels = new Map<number, Waiter<number>[]>();

  return {
    enqueue: (waiter) => {
      const queue = levels.get(waiter.input);

      if (queue) {
        queue.push(waiter);
        return;
      }

      levels.set(waiter.input, [waiter]);
    },
    dequeue: () => {
      let bestLevel: number | undefined;

      for (const level of levels.keys()) {
        if (bestLevel === undefined || level < bestLevel) {
          bestLevel = level;
        }
      }

      if (bestLevel === undefined) return undefined;

      const queue = levels.get(bestLevel);
      const waiter = queue?.shift();

      if (!queue?.length) {
        levels.delete(bestLevel);
      }

      return waiter;
    },
  };
};

const dequeScheduler = (): Scheduler<DequeDirection> => {
  const queue: Waiter<DequeDirection>[] = [];

  return {
    enqueue: (waiter) => {
      if (waiter.input === 'front') {
        queue.unshift(waiter);
        return;
      }

      queue.push(waiter);
    },
    dequeue: () => queue.shift(),
  };
};

const createLock = <T>(capacity: number, scheduler: Scheduler<T>, defaultInput: T) => {
  validateCapacity(capacity);

  let available = capacity;
  const resolverPool = new ResolverPool<T>();

  const createUnlock = (): Unlock => {
    let unlocked = false;

    return () => {
      if (unlocked) return;
      unlocked = true;

      const next = scheduler.dequeue();

      if (next) {
        next.resolve(createUnlock());
        return;
      }

      available += 1;
    };
  };

  return (input = defaultInput) => {
    if (available > 0) {
      available -= 1;
      return Promise.resolve(createUnlock());
    }

    const [promise, waiter] = resolverPool.create(input);
    scheduler.enqueue(waiter);

    return promise;
  };
};

export const core = (capacity = 1): Lock => createLock(capacity, fifoScheduler<void>(), undefined);

export const mutex = (): Mutex => core();

export const semaphore = (capacity: number): Semaphore => core(capacity);

export const priority = (): PriorityLock => createLock(1, priorityScheduler(), 0);

export const stack = (): StackLock => createLock(1, stackScheduler<void>(), undefined);

export const multilevelPriority = (): MultilevelPriorityLock => createLock(1, multilevelPriorityScheduler(), 0);

export const deque = (): DequeLock => createLock(1, dequeScheduler(), 'back');
