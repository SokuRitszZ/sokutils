import { describe, expect, it } from 'vitest';
import { lock } from '.';
import { sleep } from './test-utils';

describe('[lock.priority]', () => {
  it('queues callers by lower numeric priority without preempting the current holder', async () => {
    const priorityLock = lock.priority();
    const events: string[] = [];

    const firstUnlock = await priorityLock(10);
    events.push('start:first');

    const lowPriority = priorityLock(20).then((unlock) => {
      events.push('start:low');
      unlock();
    });
    const highPriority = priorityLock(1).then((unlock) => {
      events.push('start:high');
      unlock();
    });

    await sleep(10);
    expect(events).toEqual(['start:first']);

    firstUnlock();
    await Promise.all([lowPriority, highPriority]);

    expect(events).toEqual(['start:first', 'start:high', 'start:low']);
  });
});
