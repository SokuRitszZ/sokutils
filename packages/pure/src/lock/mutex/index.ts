import { defineLockStrategy } from '../core';

export type LockMutexStrategyType = 'queue' | 'stack';

export const LockMutexStrategy = (type: LockMutexStrategyType = 'queue') => {
  return defineLockStrategy({
    initContext: () => ({ handling: false, inputs: [] as [][] }),
    enqueue: (ctx, input: []) => {
      ctx.inputs.push(input);
      return ctx;
    },
    dequeue: (ctx) => {
      const input = type === 'queue' ? ctx.inputs.shift() : ctx.inputs.pop();
      ctx.handling = true;
      return [ctx, input!] as const;
    },
    unlock: (ctx) => {
      ctx.handling = false;
      return ctx;
    },
    blocked: ctx => ctx.handling || ctx.inputs.length <= 0,
  });
};

export type { Mutex } from './types';
