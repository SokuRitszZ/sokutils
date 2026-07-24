import { describe, expect, it } from 'vitest';
import { CACHE_DEFAULT_KEY_GENERATOR } from '../../consts';
import { CacheCore } from '../../core';
import { CachePresetStrategyLRU } from './lru';

describe('[CachePresetStrategyLRU]', () => {
  it('returns recently used keys as the next context and picked keys', () => {
    const strategy = CachePresetStrategyLRU(2);
    const first = strategy.Match({
      CurrentContext: strategy.InitContext(),
      Key: 'a',
      Params: [],
    });
    const second = strategy.Match({
      CurrentContext: first.NextContext,
      Key: 'b',
      Params: [],
    });
    const third = strategy.Match({
      CurrentContext: second.NextContext,
      Key: 'a',
      Params: [],
    });
    const fourth = strategy.Match({
      CurrentContext: third.NextContext,
      Key: 'c',
      Params: [],
    });

    expect(first.Hit).toBe(false);
    expect(second.Hit).toBe(false);
    expect(third.Hit).toBe(true);
    expect(third.NextContext).toEqual(['b', 'a']);
    expect(third.PickedKeys).toEqual(['b', 'a']);
    expect(fourth.NextContext).toEqual(['a', 'c']);
    expect(fourth.PickedKeys).toEqual(['a', 'c']);
  });

  it('lets CacheCore evict cached values outside picked keys', () => {
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CachePresetStrategyLRU(2),
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    expect(cached('b')).toBe('b:2');
    expect(cached('a')).toBe('a:1');
    expect(cached('c')).toBe('c:3');
    expect(cached('b')).toBe('b:4');
    expect(cached('a')).toBe('a:5');
  });
});
