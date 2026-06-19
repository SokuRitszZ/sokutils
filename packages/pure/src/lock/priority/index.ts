import { maxBy } from 'es-toolkit';
import { createLock, defineLockStrategy } from '../core';
import type { PriorityLock } from './types';

type PriorityInput = [number?];

export const LockPriorityStrategy = () => {
  return defineLockStrategy({
    initContext: () => ({
      handling: false,
      inputs: [] as { input: PriorityInput; priority: number }[],
    }),
    enqueue: (ctx, input: PriorityInput) => {
      ctx.inputs.push({ input, priority: input[0] ?? 0 });
      return ctx;
    },
    dequeue: (ctx) => {
      const next = maxBy(ctx.inputs, ({ priority }) => -priority)!;
      ctx.handling = true;
      return [ctx, ctx.inputs.splice(ctx.inputs.indexOf(next), 1)[0].input] as const;
    },
    unlock: (ctx) => {
      ctx.handling = false;
      return ctx;
    },
    blocked: ctx => ctx.handling || ctx.inputs.length <= 0,
  });
};

export const priority = (): PriorityLock => createLock(LockPriorityStrategy());

export type { PriorityLock } from './types';
