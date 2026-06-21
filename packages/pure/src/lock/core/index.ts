import type { LockStrategy, Unlock } from './types';

export * from './types';

type Resolver = () => void;

export const validateCapacity = (capacity: number) => {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new TypeError('Lock capacity must be a positive integer');
  }
};

export const createLock = <LockContext, LockInput extends any[]>(
  strategy: LockStrategy<LockContext, LockInput>,
) => {
  let ctx: LockContext = strategy.initContext();
  const resolverMap = new WeakMap<LockInput, Resolver>();

  const schedule = () => {
    if (strategy.blocked(ctx)) return;

    const [newCtx, input] = strategy.dequeue(ctx);
    const resolver = resolverMap.get(input);

    ctx = newCtx;
    resolver?.();
    resolverMap.delete(input);
  };

  return (...input: LockInput) => {
    let resolver: Resolver;
    let unlocked = false;
    const unlock: Unlock = () => {
      if (unlocked) return;
      unlocked = true;
      ctx = strategy.unlock(ctx, input);
      schedule();
    };
    const promise = new Promise<Unlock>(resolve => resolver = () => resolve(unlock));

    resolverMap.set(input, resolver!);
    ctx = strategy.enqueue(ctx, input);
    schedule();

    return promise;
  };
};

export const defineLockStrategy = <LockContext, LockInput extends any[]>(
  strategy: LockStrategy<LockContext, LockInput>,
) => strategy;

export const LockCoreStrategy = (capacity = 1) => {
  validateCapacity(capacity);

  return defineLockStrategy({
    initContext: () => ({ available: capacity, inputs: [] as [][] }),
    enqueue: (ctx, input: []) => {
      ctx.inputs.push(input);
      return ctx;
    },
    dequeue: (ctx) => {
      ctx.available -= 1;
      return [ctx, ctx.inputs.shift()!] as const;
    },
    unlock: (ctx) => {
      ctx.available += 1;
      return ctx;
    },
    blocked: ctx => ctx.available <= 0 || ctx.inputs.length <= 0,
  });
};
