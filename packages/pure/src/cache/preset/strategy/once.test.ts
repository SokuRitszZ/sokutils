import { describe, expect, it } from 'vitest';
import { CachePresetStrategyOnce } from './once';

describe('[CachePresetStrategyOnce]', () => {
  it('hits only after a key has been seen', () => {
    const strategy = CachePresetStrategyOnce();
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

    expect(first.Hit).toBe(false);
    expect(first.NextContext).toEqual({ a: true });
    expect(second.Hit).toBe(true);
  });
});
