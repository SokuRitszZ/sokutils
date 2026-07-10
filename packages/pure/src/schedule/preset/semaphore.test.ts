import { describe, expect, it } from 'vitest';
import { ScheduleCore } from '../core';
import { barrier, flushMicrotasks } from '../test-utils';
import { SchedulePresetStrategySemaphore } from './semaphore';

describe('[SchedulePresetStrategySemaphore]', () => {
  it('never lets the active weight exceed capacity', async () => {
    const capacity = 3;
    const schedule = ScheduleCore({
      JobCapacity: capacity,
      Strategy: SchedulePresetStrategySemaphore(capacity),
    });
    const rendezvous = barrier(capacity);
    let activeWeight = 0;
    let maxActiveWeight = 0;

    const task = async (id: number) => {
      const unlock = await schedule(1);
      activeWeight += 1;
      maxActiveWeight = Math.max(maxActiveWeight, activeWeight);
      await rendezvous();
      activeWeight -= 1;
      unlock();
      return id;
    };

    await expect(Promise.all([task(1), task(2), task(3), task(4)]))
      .resolves.toEqual([1, 2, 3, 4]);
    expect(maxActiveWeight).toBe(capacity);
  });

  it('keeps an unsatisfied request pending until enough capacity is released', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 3,
      Strategy: SchedulePresetStrategySemaphore(3),
    });
    const firstUnlock = await schedule(2);
    const secondUnlock = await schedule(1);
    let pendingAcquired = false;
    const pending = schedule(2).then((unlock) => {
      pendingAcquired = true;
      return unlock;
    });

    secondUnlock();
    await flushMicrotasks();
    expect(pendingAcquired).toBe(false);

    firstUnlock();
    const pendingUnlock = await pending;
    expect(pendingAcquired).toBe(true);
    pendingUnlock();
  });

  it('continuously wakes every waiter that fits after one release', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 3,
      Strategy: SchedulePresetStrategySemaphore(3),
    });
    const holderUnlock = await schedule(3);
    const acquired: number[] = [];
    const pending = [1, 2, 3].map(id => schedule(1).then((unlock) => {
      acquired.push(id);
      return unlock;
    }));

    await flushMicrotasks();
    expect(acquired).toEqual([]);

    holderUnlock();
    const unlocks = await Promise.all(pending);
    expect(acquired).toEqual([1, 2, 3]);
    unlocks.forEach(unlock => unlock());
  });

  it('uses first-fit while preserving FIFO order among eligible waiters', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 3,
      Strategy: SchedulePresetStrategySemaphore(3),
    });
    const holderOne = await schedule(1);
    const holderTwo = await schedule(1);
    const holderThree = await schedule(1);
    const acquired: string[] = [];
    const large = schedule(2).then((unlock) => {
      acquired.push('large');
      return unlock;
    });
    const smallOne = schedule(1).then((unlock) => {
      acquired.push('small-one');
      return unlock;
    });
    const smallTwo = schedule(1).then((unlock) => {
      acquired.push('small-two');
      return unlock;
    });

    holderOne();
    const smallOneUnlock = await smallOne;
    await flushMicrotasks();
    expect(acquired).toEqual(['small-one']);

    smallOneUnlock();
    const smallTwoUnlock = await smallTwo;
    expect(acquired).toEqual(['small-one', 'small-two']);

    holderTwo();
    await flushMicrotasks();
    expect(acquired).toEqual(['small-one', 'small-two']);

    smallTwoUnlock();
    const largeUnlock = await large;
    expect(acquired).toEqual(['small-one', 'small-two', 'large']);

    holderThree();
    largeUnlock();
  });

  it('does not add capacity when an old release is called twice', async () => {
    const schedule = ScheduleCore({
      JobCapacity: 1,
      Strategy: SchedulePresetStrategySemaphore(1),
    });
    const firstUnlock = await schedule(1);
    const second = schedule(1);
    let thirdAcquired = false;
    const third = schedule(1).then((unlock) => {
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

  it.each([0, -1, 1.5, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN])(
    'rejects invalid capacity %s',
    (capacity) => {
      expect(() => SchedulePresetStrategySemaphore(capacity)).toThrow(TypeError);
    },
  );
});
