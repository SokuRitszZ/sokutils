import { minBy } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

interface ShortestJobFirstMeta {
  cost: number;
}

type ShortestJobFirstInput = [cost: number];

export const SchedulePresetStrategyShortestJobFirst = ScheduleDefineStrategy<
  [],
  ShortestJobFirstMeta,
  ShortestJobFirstInput
>(() => {
  return {
    Pend: cost => ({ cost }),
    Pick: prop => minBy([...prop.PendingPool], meta => meta.cost),
  };
});
