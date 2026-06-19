import { minBy } from 'es-toolkit';
import { defineLockStrategy } from '../next-core';

export const LockSemaphoreStrategy = (
  available: number,
) => {
  return defineLockStrategy({
    initContext: () => ({
      available,
      inputs: [] as [number][],
    }),
    enqueue: (ctx, input: [number]) => {
      ctx.inputs.push(input);
      return ctx;
    },
    dequeue: (ctx) => {
      const scheduled = ctx.inputs.find((input) => ctx.available >= input[0])!;
      ctx.available -= scheduled[0];
      ctx.inputs = ctx.inputs.filter(x => x !== scheduled);
      return [ctx, scheduled] as const;
    },
    unlock: (ctx, input) => {
      ctx.available += input[0];
      return ctx;
    },
    blocked: (ctx) => {
      return ctx.inputs.length <= 0
        || ctx.available < minBy(ctx.inputs, ([cap]) => cap)![0];
    },
  });
};
