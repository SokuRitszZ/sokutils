import { afterEach, describe, expect, it, vi } from 'vitest';
import { CACHE_DEFAULT_KEY_GENERATOR } from '../../consts';
import { CacheCore } from '../../core';
import { CachePresetStrategyTimeout } from './timeout';

describe('[CachePresetStrategyTimeout]', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('hits cached keys until their timeout expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    const strategy = CachePresetStrategyTimeout(100);
    const first = strategy.Match({
      CurrentContext: strategy.InitContext(),
      Key: 'a',
      Params: [],
    });
    vi.setSystemTime(1050);
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
    expect(first.NextContext).toEqual({ a: 1000 });
    expect(first.PickedKeys).toEqual(['a']);
    expect(second.Hit).toBe(true);
    expect(second.NextContext).toEqual({ a: 1000 });
    expect(third.Hit).toBe(false);
    expect(third.NextContext).toEqual({ a: 1101 });
  });

  it('lets CacheCore recompute timed-out values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CachePresetStrategyTimeout(100),
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    vi.setSystemTime(1050);
    expect(cached('a')).toBe('a:1');
    vi.setSystemTime(1101);
    expect(cached('a')).toBe('a:2');
  });
});
