import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { flushMicrotasks } from '../test-utils';
import { SchedulePresetStrategyDeque } from './deque';

describe('[SchedulePresetStrategyDeque]', () => {
  it('defaults to back and lets front waiters run before queued back waiters', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyDeque(),
    });
    const events: string[] = [];
    const holderUnlock = await schedule();

    const backFirst = schedule().then((unlock) => {
      events.push('back:first');
      unlock();
    });
    const backSecond = schedule('back').then((unlock) => {
      events.push('back:second');
      unlock();
    });
    const frontFirst = schedule('front').then((unlock) => {
      events.push('front:first');
      unlock();
    });
    const frontSecond = schedule('front').then((unlock) => {
      events.push('front:second');
      unlock();
    });

    await flushMicrotasks();
    expect(events).toEqual([]);

    holderUnlock();
    await Promise.all([backFirst, backSecond, frontFirst, frontSecond]);
    expect(events).toEqual([
      'front:second',
      'front:first',
      'back:first',
      'back:second',
    ]);
  });
});
