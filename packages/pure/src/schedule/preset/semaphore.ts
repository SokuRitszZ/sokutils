import { sumBy } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

interface SemaphoreMeta {
  used: number;
}

type SemaphoreInput = [used: number];

export const SchedulePresetStrategySemaphore = ScheduleDefineStrategy<
  [capacity: number],
  SemaphoreMeta,
  SemaphoreInput
>((capacity) => {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new TypeError('Schedule semaphore capacity must be a positive integer');
  }

  return {
    Pend: (used: number) => {
      return { used };
    },
    Pick: (prop) => {
      const processingUsed = sumBy([...prop.ProcessingPool], meta => meta.used);
      const available = capacity - processingUsed;
      return prop.PendingPool.values().find(meta => meta.used <= available);
    },
  };
});
