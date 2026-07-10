import { last } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

type LifoMeta = object;

type LifoInput = [];

export const SchedulePresetStrategyLifo = ScheduleDefineStrategy<
  [],
  LifoMeta,
  LifoInput
>(() => {
  return {
    Pend: () => ({}),
    Pick: prop => last([...prop.PendingPool]),
  };
});
