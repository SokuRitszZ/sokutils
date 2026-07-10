import { maxBy } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

interface PriorityMeta {
  priority: number;
}

type PriorityInput = [priority?: number];

export const SchedulePresetStrategyPriority = ScheduleDefineStrategy<
  [],
  PriorityMeta,
  PriorityInput
>(() => {
  return {
    Pend: (priority = 0) => ({ priority }),
    Pick: (prop) => {
      const selected = maxBy([...prop.PendingPool], meta => meta.priority);

      return selected;
    },
  };
});
