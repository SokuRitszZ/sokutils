import { describe, expect, it } from 'vitest';
import { lock } from '..';

describe('[lock.mutex]', () => {
  it('creates a callable mutex alias', async () => {
    const mutex = lock.mutex();
    const unlock = await mutex();

    unlock();

    await expect(mutex()).resolves.toEqual(expect.any(Function));
  });
});
