import { minBy } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

interface DeadlineMeta {
  deadline: number;
}

type DeadlineInput = [deadline: number];

export const SchedulePresetStrategyDeadline = ScheduleDefineStrategy<
  [],
  DeadlineMeta,
  DeadlineInput
>(() => {
  return {
    Pend: deadline => ({ deadline }),
    Pick: prop => minBy([...prop.PendingPool], meta => meta.deadline),
  };
});
