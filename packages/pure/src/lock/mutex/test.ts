import { describe, expect, it } from 'vitest';
import { createLock } from '../core';
import { LockMutexStrategy } from '.';

describe('[LockMutexStrategy]', () => {
  it('creates a callable mutex lock', async () => {
    const mutex = createLock(LockMutexStrategy());
    const unlock = await mutex();

    unlock();

    await expect(mutex()).resolves.toEqual(expect.any(Function));
  });
});
