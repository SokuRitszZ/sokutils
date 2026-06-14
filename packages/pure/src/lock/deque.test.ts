import { describe, expect, it } from 'vitest';
import { lock } from '.';
import { sleep } from './test-utils';

describe('[lock.deque]', () => {
  it('queues callers at the back by default', async () => {
    const deque = lock.deque();
    const events: string[] = [];

    const firstUnlock = await deque();

    const second = deque().then((unlock) => {
      events.push('second');
      unlock();
    });
    const third = deque('back').then((unlock) => {
      events.push('third');
      unlock();
    });

    firstUnlock();
    await Promise.all([second, third]);

    expect(events).toEqual(['second', 'third']);
  });

  it('runs front waiters before already queued back waiters', async () => {
    const deque = lock.deque();
    const events: string[] = [];

    const firstUnlock = await deque();

    const back = deque('back').then((unlock) => {
      events.push('back');
      unlock();
    });
    const front = deque('front').then((unlock) => {
      events.push('front');
      unlock();
    });

    firstUnlock();
    await Promise.all([back, front]);

    expect(events).toEqual(['front', 'back']);
  });

  it('does not preempt the current holder when a waiter joins the front', async () => {
    const deque = lock.deque();
    const events: string[] = [];

    const firstUnlock = await deque();
    events.push('start:first');

    const second = deque('front').then((unlock) => {
      events.push('start:front');
      unlock();
    });

    await sleep(10);
    expect(events).toEqual(['start:first']);

    firstUnlock();
    await second;

    expect(events).toEqual(['start:first', 'start:front']);
  });
});
