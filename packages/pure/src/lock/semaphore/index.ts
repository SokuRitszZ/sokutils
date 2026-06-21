import { minBy } from 'es-toolkit';
import { defineLockStrategy, validateCapacity } from '../core';

export const LockSemaphoreStrategy = (available: number) => {
  validateCapacity(available);

  return defineLockStrategy({
    initContext: () => ({ available, inputs: [] as [number][] }),
    enqueue: (ctx, input: [number]) => {
      ctx.inputs.push(input);
      return ctx;
    },
    dequeue: (ctx) => {
      const scheduled = ctx.inputs.find(input => ctx.available >= input[0])!;
      ctx.available -= scheduled[0];
      ctx.inputs = ctx.inputs.filter(input => input !== scheduled);
      return [ctx, scheduled] as const;
    },
    unlock: (ctx, input) => {
      ctx.available += input[0];
      return ctx;
    },
    blocked: ctx => ctx.inputs.length <= 0
      || ctx.available < minBy(ctx.inputs, ([capacity]) => capacity)![0],
  });
};

export type { Semaphore } from './types';
