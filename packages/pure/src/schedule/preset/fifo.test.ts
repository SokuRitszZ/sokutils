import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { flushMicrotasks } from '../test-utils';
import { SchedulePresetStrategyFifo } from './fifo';

describe('[SchedulePresetStrategyFifo]', () => {
  it('picks waiters in insertion order', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyFifo(),
    });
    const holderUnlock = await schedule();
    const events: number[] = [];
    const pending = [1, 2, 3].map(id => schedule().then((unlock) => {
      events.push(id);
      unlock();
    }));

    await flushMicrotasks();
    expect(events).toEqual([]);

    holderUnlock();
    await Promise.all(pending);
    expect(events).toEqual([1, 2, 3]);
  });
});
