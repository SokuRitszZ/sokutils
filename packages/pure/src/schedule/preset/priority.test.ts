import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { flushMicrotasks } from '../test-utils';
import { SchedulePresetStrategyPriority } from './priority';

describe('[SchedulePresetStrategyPriority]', () => {
  it('runs higher numeric priorities first and preserves FIFO within a priority', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyPriority(),
    });
    const events: string[] = [];
    const holderUnlock = await schedule(10);
    events.push('holder');

    const highest = schedule(20).then((unlock) => {
      events.push('highest');
      unlock();
    });
    const equalFirst = schedule(1).then((unlock) => {
      events.push('equal:first');
      unlock();
    });
    const equalSecond = schedule(1).then((unlock) => {
      events.push('equal:second');
      unlock();
    });
    const defaultPriority = schedule().then((unlock) => {
      events.push('default');
      unlock();
    });

    await flushMicrotasks();
    expect(events).toEqual(['holder']);

    holderUnlock();
    await Promise.all([highest, equalFirst, equalSecond, defaultPriority]);
    expect(events).toEqual([
      'holder',
      'highest',
      'equal:first',
      'equal:second',
      'default',
    ]);
  });
});
