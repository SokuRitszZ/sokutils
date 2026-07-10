import { describe, expect, it, vi } from 'vitest';
import { ScheduleCore } from './core';
import { flushMicrotasks } from './test-utils';
import type { ScheduleStrategy } from './types';

interface TestMeta {
  id: string;
  used: number;
}

const createWeightedStrategy = (capacity: number): ScheduleStrategy<TestMeta, [id: string, used: number]> => ({
  Pend: (id, used) => ({ id, used }),
  Pick: ({ PendingPool, ProcessingPool }) => {
    const processingUsed = [...ProcessingPool].reduce((total, meta) => total + meta.used, 0);
    const available = capacity - processingUsed;
    return PendingPool.values().find(meta => meta.used <= available);
  },
});

describe('[ScheduleCore]', () => {
  it('passes input to Pend once and moves the selected meta between pools', async () => {
    const snapshots: Array<{
      pending: string[];
      processing: string[];
    }> = [];
    const strategy = createWeightedStrategy(1);
    const pend = vi.fn(strategy.Pend);
    const pick = vi.fn((options: Parameters<typeof strategy.Pick>[0]) => {
      snapshots.push({
        pending: [...options.PendingPool].map(meta => meta.id),
        processing: [...options.ProcessingPool].map(meta => meta.id),
      });
      return strategy.Pick(options);
    });
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: { ...strategy, Pend: pend, Pick: pick },
    });

    const firstUnlock = await schedule('first', 1);
    let secondAcquired = false;
    const second = schedule('second', 1).then((unlock) => {
      secondAcquired = true;
      return unlock;
    });
    await flushMicrotasks();

    expect(pend).toHaveBeenCalledTimes(2);
    expect(pend).toHaveBeenNthCalledWith(1, 'first', 1);
    expect(pend).toHaveBeenNthCalledWith(2, 'second', 1);
    expect(secondAcquired).toBe(false);
    expect(pick).toHaveBeenCalledTimes(1);

    firstUnlock();
    const secondUnlock = await second;
    expect(snapshots).toContainEqual({
      pending: ['second'],
      processing: [],
    });
    secondUnlock();
  });

  it('keeps unselected requests pending until unlock makes them runnable', async () => {
    const schedule = ScheduleCore({ JobCapacity: 1, Strategy: createWeightedStrategy(1) });
    const firstUnlock = await schedule('first', 1);
    let secondAcquired = false;
    const second = schedule('second', 1).then((unlock) => {
      secondAcquired = true;
      return unlock;
    });

    await flushMicrotasks();
    expect(secondAcquired).toBe(false);

    firstUnlock();
    const secondUnlock = await second;
    expect(secondAcquired).toBe(true);
    secondUnlock();
  });

  it('continuously picks every request made runnable by one pool change', async () => {
    const schedule = ScheduleCore({ JobCapacity: 3, Strategy: createWeightedStrategy(3) });
    const holderUnlock = await schedule('holder', 3);
    const acquired: string[] = [];
    const pending = ['first', 'second', 'third'].map(id => schedule(id, 1).then((unlock) => {
      acquired.push(id);
      return unlock;
    }));

    await flushMicrotasks();
    expect(acquired).toEqual([]);

    holderUnlock();
    const unlocks = await Promise.all(pending);
    expect(acquired).toEqual(['first', 'second', 'third']);
    unlocks.forEach(unlock => unlock());
  });

  it('treats unlock as a one-shot operation', async () => {
    const schedule = ScheduleCore({ JobCapacity: 1, Strategy: createWeightedStrategy(1) });
    const firstUnlock = await schedule('first', 1);
    const second = schedule('second', 1);
    let thirdAcquired = false;
    const third = schedule('third', 1).then((unlock) => {
      thirdAcquired = true;
      return unlock;
    });

    firstUnlock();
    const secondUnlock = await second;
    firstUnlock();
    await flushMicrotasks();
    const acquiredBeforeSecondUnlock = thirdAcquired;

    secondUnlock();
    const thirdUnlock = await third;
    thirdUnlock();
    expect(acquiredBeforeSecondUnlock).toBe(false);
  });

  it('does not share pools between core instances', async () => {
    const firstSchedule = ScheduleCore({ JobCapacity: 1, Strategy: createWeightedStrategy(1) });
    const secondSchedule = ScheduleCore({ JobCapacity: 1, Strategy: createWeightedStrategy(1) });
    const firstUnlock = await firstSchedule('first', 1);
    let blockedOnFirst = false;
    const blocked = firstSchedule('blocked', 1).then((unlock) => {
      blockedOnFirst = true;
      return unlock;
    });

    const independentUnlock = await secondSchedule('independent', 1);
    await flushMicrotasks();
    expect(blockedOnFirst).toBe(false);

    independentUnlock();
    firstUnlock();
    const blockedUnlock = await blocked;
    blockedUnlock();
  });

  it('limits the processing pool to JobCapacity before calling Pick again', async () => {
    const strategy: ScheduleStrategy<TestMeta, [id: string]> = {
      Pend: id => ({ id, used: 1 }),
      Pick: ({ PendingPool }) => PendingPool.values().next().value,
    };
    const pick = vi.fn(strategy.Pick);
    const schedule = ScheduleCore({
      JobCapacity: 2,
      Strategy: { ...strategy, Pick: pick },
    });
    const firstUnlock = await schedule('first');
    const secondUnlock = await schedule('second');
    let thirdAcquired = false;
    const third = schedule('third').then((unlock) => {
      thirdAcquired = true;
      return unlock;
    });

    await flushMicrotasks();
    expect(thirdAcquired).toBe(false);
    const pickCallsAtCapacity = pick.mock.calls.length;

    firstUnlock();
    const thirdUnlock = await third;
    expect(thirdAcquired).toBe(true);
    expect(pick).toHaveBeenCalledTimes(pickCallsAtCapacity + 1);

    secondUnlock();
    thirdUnlock();
  });

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN])(
    'rejects invalid JobCapacity %s',
    (JobCapacity) => {
      expect(() => ScheduleCore({
        JobCapacity,
        Strategy: createWeightedStrategy(1),
      })).toThrow(TypeError);
    },
  );
});
