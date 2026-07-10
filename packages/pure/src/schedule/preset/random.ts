import { sample } from 'es-toolkit';
import { ScheduleDefineStrategy } from '../define';

export interface ScheduleRandomOptions {
  Random?: () => number;
}

type RandomMeta = object;

type RandomInput = [];

export const SchedulePresetStrategyRandom = ScheduleDefineStrategy<
  [options?: ScheduleRandomOptions],
  RandomMeta,
  RandomInput
>((options = {}) => {
  return {
    Pend: () => ({}),
    Pick: (prop) => {
      const pending = [...prop.PendingPool];
      if (!options.Random) {
        return sample(pending);
      }
      return pending[Math.floor(options.Random() * pending.length)];
    },
  };
});
