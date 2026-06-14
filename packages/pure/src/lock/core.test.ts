import { describe, expect, it } from 'vitest';
import { lock } from '.';

describe('[lock.core]', () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  it('locks by awaiting the returned function and unlocks with the returned function', async () => {
    const mutex = lock.core();
    const events: string[] = [];

    const task = async (id: number) => {
      const unlock = await mutex();
      events.push(`start:${id}`);
      await sleep(10);
      events.push(`end:${id}`);
      unlock();
      return id;
    };

    const results = await Promise.all([
      task(1),
      task(2),
      task(3),
    ]);

    expect(results).toEqual([1, 2, 3]);
    expect(events).toEqual([
      'start:1',
      'end:1',
      'start:2',
      'end:2',
      'start:3',
      'end:3',
    ]);
  });

  it('does not unlock until the returned unlock function is called', async () => {
    const mutex = lock.core();
    const firstUnlock = await mutex();
    let secondLocked = false;

    const second = mutex().then((unlock) => {
      secondLocked = true;
      unlock();
    });

    await sleep(10);
    expect(secondLocked).toBe(false);

    firstUnlock();
    await second;

    expect(secondLocked).toBe(true);
  });

  it('ignores duplicate unlock calls', async () => {
    const mutex = lock.core();
    const firstUnlock = await mutex();
    const second = mutex();

    firstUnlock();
    firstUnlock();

    const secondUnlock = await second;
    secondUnlock();

    await expect(mutex()).resolves.toEqual(expect.any(Function));
  });
});

describe('[lock.mutex]', () => {
  it('creates a callable mutex alias', async () => {
    const mutex = lock.mutex();
    const unlock = await mutex();

    unlock();

    await expect(mutex()).resolves.toEqual(expect.any(Function));
  });
});

describe('[lock.semaphore]', () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  it('allows up to capacity callers to run concurrently', async () => {
    const semaphore = lock.semaphore(2);
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

    await Promise.all([
      task(),
      task(),
      task(),
      task(),
    ]);

    expect(maxActive).toBe(2);
  });

  it('queues callers in FIFO order by default', async () => {
    const semaphore = lock.semaphore(2);
    const events: string[] = [];

    const firstRelease = await semaphore();
    const secondRelease = await semaphore();

    const third = semaphore().then((release) => {
      events.push('third');
      release();
    });
    const fourth = semaphore().then((release) => {
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
