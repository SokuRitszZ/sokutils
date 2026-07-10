import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { flushMicrotasks } from '../test-utils';
import { SchedulePresetStrategyLifo } from './lifo';

describe('[SchedulePresetStrategyLifo]', () => {
  it('picks the most recently inserted waiter first', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategyLifo(),
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
    expect(events).toEqual([3, 2, 1]);
  });
});
