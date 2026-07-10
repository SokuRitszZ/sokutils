import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { SchedulePresetStrategyRandom } from './random';

describe('[SchedulePresetStrategyRandom]', () => {
  it('uses the injected random source to choose a waiter', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyRandom({ Random: () => 0.5 }),
    });
    const holderUnlock = await schedule();
    const events: number[] = [];
    const pending = [1, 2, 3].map(id => schedule().then((unlock) => {
      events.push(id);
      unlock();
    }));

    holderUnlock();
    await Promise.all(pending);
    expect(events).toEqual([2, 3, 1]);
  });
});
