import type { DequeDirection, Scheduler, Waiter } from './types';

export const fifoScheduler = <T>(): Scheduler<T> => {
  const queue: Waiter<T>[] = [];

  return {
    enqueue: waiter => queue.push(waiter),
    dequeue: () => queue.shift(),
  };
};

export const stackScheduler = <T>(): Scheduler<T> => {
  const queue: Waiter<T>[] = [];

  return {
    enqueue: waiter => queue.push(waiter),
    dequeue: () => queue.pop(),
  };
};

export const priorityScheduler = (): Scheduler<number> => {
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

export const multilevelPriorityScheduler = (): Scheduler<number> => {
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

export const dequeScheduler = (): Scheduler<DequeDirection> => {
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
