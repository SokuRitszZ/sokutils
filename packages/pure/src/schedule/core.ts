import { once } from 'es-toolkit';
import type {
  ScheduleCoreOptions,
  ScheduleLock,
  ScheduleResolver,
  ScheduleUnlock,
} from './types';

export const ScheduleCore = <Meta extends object, Input extends any[]>(
  options: ScheduleCoreOptions<Meta, Input>,
): ScheduleLock<Input> => {
  if (!Number.isInteger(options.JobCapacity) || options.JobCapacity < 1) {
    throw new TypeError('Schedule job capacity must be a positive integer');
  }

  const pendingPool = new Set<Meta>();
  const processingPool = new Set<Meta>();
  const metaResolverMap = new Map<Meta, ScheduleResolver>();

  // pending 或 processing pool 发生变化时重新调度
  const handleAnyPoolChange = () => {
    if (pendingPool.size <= 0 || processingPool.size >= options.JobCapacity) {
      return;
    }
    const meta = options.Strategy.Pick({
      PendingPool: pendingPool,
      ProcessingPool: processingPool,
    });
    if (!meta) {
      return;
    }
    const resolver = metaResolverMap.get(meta);
    metaResolverMap.delete(meta);
    pendingPool.delete(meta);
    processingPool.add(meta);
    resolver?.();
    // 这里本身池子也变化了
    handleAnyPoolChange();
  };

  const lock = (...input: Input) => {
    let resolver: ScheduleResolver;
    const meta = options.Strategy.Pend(...input);
    const unlock: ScheduleUnlock = once(() => {
      processingPool.delete(meta);
      // 池子变化
      handleAnyPoolChange();
    });
    const promise = new Promise<ScheduleUnlock>((_resolver) => {
      resolver = () => {
        _resolver(unlock);
      };
    });

    metaResolverMap.set(meta, resolver!);
    pendingPool.add(meta);
    handleAnyPoolChange();

    return promise;
  };

  return lock;
};
