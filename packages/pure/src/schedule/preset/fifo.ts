import { head } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

type FifoMeta = object;

type FifoInput = [];

export const SchedulePresetStrategyFifo = ScheduleDefineStrategy<
  [],
  FifoMeta,
  FifoInput
>(() => {
  return {
    Pend: () => ({}),
    Pick: prop => head([...prop.PendingPool]),
  };
});
