import { describe, expect, it } from 'vitest';
import { lock } from '.';

describe('[lock.stack]', () => {
  it('queues callers in LIFO order', async () => {
    const stack = lock.stack();
    const events: string[] = [];

    const firstUnlock = await stack();

    const second = stack().then((unlock) => {
      events.push('second');
      unlock();
    });
    const third = stack().then((unlock) => {
      events.push('third');
      unlock();
    });
    const fourth = stack().then((unlock) => {
      events.push('fourth');
      unlock();
    });

    firstUnlock();
    await Promise.all([second, third, fourth]);

    expect(events).toEqual(['fourth', 'third', 'second']);
  });
});
