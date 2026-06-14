import type { Scheduler, Unlock, Waiter, Resolver } from './types';

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

export const validateCapacity = (capacity: number) => {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new TypeError('Lock capacity must be a positive integer');
  }
};

export const createLock = <T>(capacity: number, scheduler: Scheduler<T>, defaultInput: T) => {
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
