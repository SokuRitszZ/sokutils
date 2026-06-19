import { LockStrategy } from './types';
export * from './types';

type Unlock = () => void;
type Resolver = () => void;

export const createLock = <LockContext, LockInput extends any[]>(strategy: LockStrategy<LockContext, LockInput>) => {
  let ctx: LockContext = strategy.initContext();
  const resolverMap = new WeakMap<LockInput, Resolver>();
  const schedule = () => {
    if (strategy.blocked(ctx)) {
      return;
    }

    const [newCtx, input] = strategy.dequeue(ctx);
    const resolver = resolverMap.get(input);

    ctx = newCtx;
    resolver?.();
    resolverMap.delete(input);
  };

  const lock = (...input: LockInput) => {
    let resolver: () => void;
    const unlock: Unlock = () => {
      ctx = strategy.unlock(ctx, input);
      schedule();
    };
    const promise = new Promise<Unlock>((resolve) => resolver = () => resolve(unlock));

    resolverMap.set(input, resolver!);
    ctx = strategy.enqueue(ctx, input);
    schedule();

    return promise;
  };

  return lock;
};

export const defineLockStrategy = <LockContext, LockInput extends any[]>(strategy: LockStrategy<LockContext, LockInput>) => {
  return strategy;
};
