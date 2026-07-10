import { ScheduleDefineStrategy } from '../define';

export type ScheduleDequeDirection = 'front' | 'back';

interface DequeMeta {
  direction: ScheduleDequeDirection;
}

type DequeInput = [direction?: ScheduleDequeDirection];

export const SchedulePresetStrategyDeque = ScheduleDefineStrategy<
  [],
  DequeMeta,
  DequeInput
>(() => {
  return {
    Pend: (direction = 'back') => ({ direction }),
    Pick: (prop) => {
      const array = [...prop.PendingPool];
      const selected = array.findLast(meta => meta.direction === 'front') || array[0];

      return selected;
    },
  };
});
