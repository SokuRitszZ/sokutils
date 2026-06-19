import { createLock, defineLockStrategy } from '../core';
import type { PriorityLock } from './types';

type PriorityInput = [number?];

export const LockPriorityStrategy = () => {
  return defineLockStrategy({
    initContext: () => ({
      handling: false,
      inputs: [] as { input: PriorityInput; order: number; priority: number }[],
      order: 0,
    }),
    enqueue: (ctx, input: PriorityInput) => {
      ctx.inputs.push({ input, order: ctx.order++, priority: input[0] ?? 0 });
      return ctx;
    },
    dequeue: (ctx) => {
      let bestIndex = 0;

      for (let index = 1; index < ctx.inputs.length; index += 1) {
        const candidate = ctx.inputs[index];
        const best = ctx.inputs[bestIndex];

        if (candidate.priority < best.priority
          || (candidate.priority === best.priority && candidate.order < best.order)) {
          bestIndex = index;
        }
      }

      ctx.handling = true;
      return [ctx, ctx.inputs.splice(bestIndex, 1)[0].input] as const;
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
