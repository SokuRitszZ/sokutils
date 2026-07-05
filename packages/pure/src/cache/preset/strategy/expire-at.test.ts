import { afterEach, describe, expect, it, vi } from 'vitest';
import { CACHE_DEFAULT_KEY_GENERATOR } from '../../consts';
import { CacheCore } from '../../core';
import { CachePresetStrategyExpireAt } from './expire-at';

describe('[CachePresetStrategyExpireAt]', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hits cached keys before the expire-at timestamp and clears after it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    const strategy = CachePresetStrategyExpireAt(1100);
    const first = strategy.Match({
      CurrentContext: strategy.InitContext(),
      Key: 'a',
      Params: [],
    });
    const second = strategy.Match({
      CurrentContext: first.NextContext,
      Key: 'a',
      Params: [],
    });
    vi.setSystemTime(1101);
    const third = strategy.Match({
      CurrentContext: second.NextContext,
      Key: 'a',
      Params: [],
    });

    expect(first.Hit).toBe(false);
    expect(first.NextContext).toEqual({ a: true });
    expect(second.Hit).toBe(true);
    expect(third.Hit).toBe(false);
    expect(third.NextContext).toEqual({});
    expect(third.PickedKeys).toEqual([]);
  });

  it('lets CacheCore recompute every call after expiration', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CachePresetStrategyExpireAt(1100),
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    expect(cached('a')).toBe('a:1');
    vi.setSystemTime(1101);
    expect(cached('a')).toBe('a:2');
    expect(cached('a')).toBe('a:3');
  });
});
