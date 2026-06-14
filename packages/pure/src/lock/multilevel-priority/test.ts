import { describe, expect, it } from 'vitest';
import { lock } from '..';

describe('[lock.multilevelPriority]', () => {
  it('selects lower numeric priority levels first and preserves FIFO within a level', async () => {
    const multilevelPriority = lock.multilevelPriority();
    const events: string[] = [];

    const firstUnlock = await multilevelPriority(5);

    const low = multilevelPriority(10).then((unlock) => {
      events.push('low');
      unlock();
    });
    const highFirst = multilevelPriority(1).then((unlock) => {
      events.push('high:first');
      unlock();
    });
    const highSecond = multilevelPriority(1).then((unlock) => {
      events.push('high:second');
      unlock();
    });

    firstUnlock();
    await Promise.all([low, highFirst, highSecond]);

    expect(events).toEqual(['high:first', 'high:second', 'low']);
  });
});
