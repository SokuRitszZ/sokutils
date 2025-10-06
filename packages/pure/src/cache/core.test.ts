import { describe, expect, it } from 'vitest';
import { random, times } from 'lodash-es';
import { strategy } from './strategy';
import { cache } from '.';


describe('[cache.core]', () => {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rand = (_: number) => Math.random();

  it('default', () => {
    const cached = cache.core(rand);

    expect(cached(1)).not.toBeUndefined();
    expect(cached(1)).toBe(cached(1));
    expect(cached(2)).toBe(cached(2));
    expect(cached(1)).not.toBe(cached(2));
  });

  it('duration strategy', async () => {
    const cached = cache.core(rand)
      .strategy(strategy.duration(1000));

    expect(cached(1)).toBe(await sleep(100).then(() => cached(1)));
    expect(cached(1)).toBe(await sleep(200).then(() => cached(1)));
    expect(cached(1)).not.toBe(await sleep(701).then(() => cached(1)));
    expect(cached(1)).toBe(cached(1));
  });

  it('lru strategy', async () => {
    const N = random(4, 10);
    
    const cached = cache.core(rand)
      .strategy(strategy.lru(N));

    const preTwo = cached(2);
    times(N, i => expect(cached(i)).toBe(cached(i)));
    
    // the 0 has been queued to tail;
    // [0, 1, 2] -> [1, 2, 0]
    const preZero = cached(0);
    // [1, 2, 0] -> [2, 0, N]
    cached(N);
    // [2, 0, N] -> [2, N, 0]
    const curZero = cached(0);

    expect(preZero).toBe(curZero);
    
    // [2, N, 0] -> [N, 0, N+1]
    cached(N + 1);
    // [N, 0, N+1] -> [0, N+1, 2]
    expect(preTwo).not.toBe(cached(2));
  });
});