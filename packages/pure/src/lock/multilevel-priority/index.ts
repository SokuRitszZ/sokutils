import { minBy } from 'es-toolkit';
import { defineLockStrategy } from '../core';

type MultilevelPriorityInput = [number?];

export const LockMultilevelPriorityStrategy = () => {
  return defineLockStrategy({
    initContext: () => ({ handling: false, inputs: new Map<number, MultilevelPriorityInput[]>() }),
    enqueue: (ctx, input: MultilevelPriorityInput) => {
      const priority = input[0] ?? 0;
      const queue = ctx.inputs.get(priority);

      if (queue) queue.push(input);
      else ctx.inputs.set(priority, [input]);

      return ctx;
    },
    dequeue: (ctx) => {
      const priority = minBy([...ctx.inputs.keys()], priority => priority)!;
      const queue = ctx.inputs.get(priority)!;
      const input = queue.shift()!;

      if (queue.length <= 0) ctx.inputs.delete(priority);
      ctx.handling = true;

      return [ctx, input] as const;
    },
    unlock: (ctx) => {
      ctx.handling = false;
      return ctx;
    },
    blocked: ctx => ctx.handling || ctx.inputs.size <= 0,
  });
};
