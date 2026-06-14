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

describe('[lock.priority]', () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

describe('[lock.deque]', () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
