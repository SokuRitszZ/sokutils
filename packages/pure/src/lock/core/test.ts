import { describe, expect, it } from 'vitest';
import { lock } from '..';
import { sleep } from '../test-utils';

describe('[lock.core]', () => {
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
