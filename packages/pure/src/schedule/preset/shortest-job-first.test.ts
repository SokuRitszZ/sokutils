import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { SchedulePresetStrategyShortestJobFirst } from './shortest-job-first';

describe('[SchedulePresetStrategyShortestJobFirst]', () => {
  it('picks lower costs first and preserves FIFO for equal costs', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyShortestJobFirst(),
    });
    const holderUnlock = await schedule(100);
    const events: string[] = [];
    const costFive = schedule(5).then((unlock) => {
      events.push('cost:5');
      unlock();
    });
    const costOneFirst = schedule(1).then((unlock) => {
      events.push('cost:1:first');
      unlock();
    });
    const costThree = schedule(3).then((unlock) => {
      events.push('cost:3');
      unlock();
    });
    const costOneSecond = schedule(1).then((unlock) => {
      events.push('cost:1:second');
      unlock();
    });

    holderUnlock();
    await Promise.all([costFive, costOneFirst, costThree, costOneSecond]);
    expect(events).toEqual([
      'cost:1:first',
      'cost:1:second',
      'cost:3',
      'cost:5',
    ]);
  });
});
