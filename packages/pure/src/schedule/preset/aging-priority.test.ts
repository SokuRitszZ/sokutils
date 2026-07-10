import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { SchedulePresetStrategyAgingPriority } from './aging-priority';

describe('[SchedulePresetStrategyAgingPriority]', () => {
  it('raises effective priority as waiting time increases', async () => {
    let now = 0;
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyAgingPriority({
        AgingInterval: 1_000,
        Now: () => now,
      }),
    });
    const holderUnlock = await schedule(100);
    const events: string[] = [];
    const aged = schedule(0).then((unlock) => {
      events.push('aged');
      unlock();
    });

    now = 3_000;
    const newer = schedule(2).then((unlock) => {
      events.push('newer');
      unlock();
    });

    holderUnlock();
    await Promise.all([aged, newer]);
    expect(events).toEqual(['aged', 'newer']);
  });

  it.each([0, -1, Number.POSITIVE_INFINITY, Number.NaN])(
    'rejects invalid AgingInterval %s',
    (AgingInterval) => {
      expect(() => SchedulePresetStrategyAgingPriority({ AgingInterval })).toThrow(TypeError);
    },
  );
});
