import { defineLockStrategy } from '../core';
import type { DequeDirection, DequeLock } from './types';

type DequeInput = [DequeDirection?];

export const LockDequeStrategy = () => {
  return defineLockStrategy({
    initContext: () => ({ handling: false, inputs: [] as DequeInput[] }),
    enqueue: (ctx, input: DequeInput) => {
      if ((input[0] ?? 'back') === 'front') ctx.inputs.unshift(input);
      else ctx.inputs.push(input);

      return ctx;
    },
    dequeue: (ctx) => {
      ctx.handling = true;
      return [ctx, ctx.inputs.shift()!] as const;
    },
    unlock: (ctx) => {
      ctx.handling = false;
      return ctx;
    },
    blocked: ctx => ctx.handling || ctx.inputs.length <= 0,
  });
};

export type { DequeDirection, DequeLock } from './types';
