import { describe, expect, expectTypeOf, it } from 'vitest';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { z } from 'zod/v4-mini';
import { CacheBuild } from './builder';
import { CachePresetStorageIDB } from './preset/storage/idb';
import { CachePresetStrategyLRU } from './preset/strategy/lru';

describe('[CacheBuild]', () => {
  it('builds a cached function with default options', () => {
    const cached = CacheBuild()
      .Function((key: string) => ({ key }))
      .Build();

    expect(cached('a')).toBe(cached('a'));
    expect(cached('a')).not.toBe(cached('b'));
  });

  it('applies chained function, strategy, and key generator options', () => {
    let callCount = 0;
    const cached = CacheBuild()
      .Function((user: { id: string }) => {
        callCount += 1;
        return `${user.id}:${callCount}`;
      })
      .KeyGenerator(user => user.id)
      .Strategy(CachePresetStrategyLRU(1))
      .Build();

    expect(cached({ id: 'a' })).toBe('a:1');
    expect(cached({ id: 'a' })).toBe('a:1');
    expect(cached({ id: 'b' })).toBe('b:2');
    expect(cached({ id: 'a' })).toBe('a:3');
  });

  it('returns an async cached function when async storage is configured', async () => {
    const cached = CacheBuild()
      .Function((key: string) => `${key}:value`)
      .Storage(CachePresetStorageIDB({
        Key: 'builder.test.ts',
        IDBFactory: new FakeIDBFactory(),
        ValueValidationZod: z.string(),
      }))
      .Build();

    expectTypeOf(cached).toEqualTypeOf<(key: string) => Promise<string>>();
    await expect(cached('a')).resolves.toBe('a:value');
  });
});
