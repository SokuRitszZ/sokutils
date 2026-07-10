import { maxBy } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

export interface ScheduleAgingPriorityOptions {
  AgingInterval?: number;
  Now?: () => number;
}

interface AgingPriorityMeta {
  priority: number;
  pendedAt: number;
}

type AgingPriorityInput = [priority?: number];

export const SchedulePresetStrategyAgingPriority = ScheduleDefineStrategy<
  [options?: ScheduleAgingPriorityOptions],
  AgingPriorityMeta,
  AgingPriorityInput
>((options = {}) => {
  const agingInterval = options.AgingInterval ?? 1_000;
  const now = options.Now ?? Date.now;

  if (!Number.isFinite(agingInterval) || agingInterval <= 0) {
    throw new TypeError('Schedule aging interval must be a positive finite number');
  }

  return {
    Pend: (priority = 0) => ({ priority, pendedAt: now() }),
    Pick: (prop) => {
      const currentTime = now();
      return maxBy([...prop.PendingPool], (meta) => {
        const waited = Math.max(0, currentTime - meta.pendedAt);
        return meta.priority + Math.floor(waited / agingInterval);
      });
    },
  };
});
