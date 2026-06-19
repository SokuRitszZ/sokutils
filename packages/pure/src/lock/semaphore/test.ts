import { describe, expect, it } from 'vitest';
import { lock } from '..';
import { sleep } from '../test-utils';
import { createLock } from '../next-core';
import { LockSemaphoreStrategy } from './next';

describe('[lock.semaphore]', () => {
  it('allows up to capacity callers to run concurrently', async () => {
    const semaphore = createLock(
      LockSemaphoreStrategy(2),
    );
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      const release = await semaphore(1);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(10);
      active -= 1;
      release();
    };

    await Promise.all([
      task(),
      task(),
      task(),
      task(),
    ]);

    expect(maxActive).toBe(2);
  });

  it('queues callers in FIFO order by default', async () => {
    const semaphore = createLock(
      LockSemaphoreStrategy(2),
    );
    const events: string[] = [];

    const firstRelease = await semaphore(1);
    const secondRelease = await semaphore(1);

    const third = semaphore(1).then((release) => {
      events.push('third');
      release();
    });
    const fourth = semaphore(1).then((release) => {
      events.push('fourth');
      release();
    });

    await sleep(10);
    expect(events).toEqual([]);

    secondRelease();
    await third;

    firstRelease();
    await fourth;

    expect(events).toEqual(['third', 'fourth']);
  });

  it('ignores duplicate release calls', async () => {
    const semaphore = lock.semaphore(1);
    const firstRelease = await semaphore();
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      const release = await semaphore();
      active += 1;
      maxActive = Math.max(maxActive, active);
      await sleep(10);
      active -= 1;
      release();
    };

    const second = task();
    const third = task();

    firstRelease();
    firstRelease();

    await sleep(10);

    expect(maxActive).toBe(1);

    await Promise.all([second, third]);
  });

  it('requires a positive integer capacity', () => {
    expect(() => lock.semaphore(0)).toThrow(TypeError);
    expect(() => lock.semaphore(1.5)).toThrow(TypeError);
  });
});
