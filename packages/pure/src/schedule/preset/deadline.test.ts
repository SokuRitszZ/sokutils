import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { SchedulePresetStrategyDeadline } from './deadline';

describe('[SchedulePresetStrategyDeadline]', () => {
  it('picks earlier deadlines first and preserves FIFO for equal deadlines', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyDeadline(),
    });
    const holderUnlock = await schedule(1_000);
    const events: string[] = [];
    const deadlineThree = schedule(300).then((unlock) => {
      events.push('deadline:300');
      unlock();
    });
    const deadlineOneFirst = schedule(100).then((unlock) => {
      events.push('deadline:100:first');
      unlock();
    });
    const deadlineTwo = schedule(200).then((unlock) => {
      events.push('deadline:200');
      unlock();
    });
    const deadlineOneSecond = schedule(100).then((unlock) => {
      events.push('deadline:100:second');
      unlock();
    });

    holderUnlock();
    await Promise.all([deadlineThree, deadlineOneFirst, deadlineTwo, deadlineOneSecond]);
    expect(events).toEqual([
      'deadline:100:first',
      'deadline:100:second',
      'deadline:200',
      'deadline:300',
    ]);
  });
});
