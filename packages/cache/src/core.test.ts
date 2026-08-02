import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4-mini';
import { CACHE_DEFAULT_KEY_GENERATOR, CACHE_DEFAULT_STRATEGY } from './consts';
import { CacheCore } from './core';
import { CachePresetStorageLocalStorage } from './preset';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe('[CacheCore]', () => {
  const SyncFn = (str: string, num: number) => str + num;
  const AsyncFn = async (str: string, num: number) => str + num;

  it('caches sync function results without storage', () => {
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    expect(cached('a')).toBe('a:1');
    expect(cached('b')).toBe('b:2');
  });

  it('loads sync storage before matching cache values', () => {
    const storageLike = new MemoryStorage();
    storageLike.setItem('core.test.ts', JSON.stringify({
      Context: {
        [JSON.stringify(['cached', 1])]: true,
      },
      CachedValueMap: {
        [JSON.stringify(['cached', 1])]: 'from-storage',
      },
    }));

    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: SyncFn,
      Storage: CachePresetStorageLocalStorage({
        Key: 'core.test.ts',
        LocalStorageLike: storageLike,
        ValueValidationZod: z.string(),
      }),
    });

    expect(cached('cached', 1)).toBe('from-storage');
  });

  it('uses the strategy schema to validate loaded context', () => {
    const storageLike = new MemoryStorage();
    storageLike.setItem('core-context.test.ts', JSON.stringify({
      Context: [],
      CachedValueMap: {
        [JSON.stringify(['cached'])]: 'from-storage',
      },
    }));

    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => `${key}:computed`,
      Storage: CachePresetStorageLocalStorage({
        Key: 'core-context.test.ts',
        LocalStorageLike: storageLike,
        ValueValidationZod: z.string(),
      }),
    });

    expect(cached('cached')).toBe('cached:computed');
  });

  it('falls back when storage load result is invalid', () => {
    const storageLike = new MemoryStorage();
    storageLike.setItem('core-invalid.test.ts', JSON.stringify({
      Context: {
        [JSON.stringify(['cached', 1])]: true,
      },
      CachedValueMap: 'not-a-record',
    }));
    let callCount = 0;

    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
      Storage: CachePresetStorageLocalStorage({
        Key: 'core-invalid.test.ts',
        LocalStorageLike: storageLike,
        ValueValidationZod: z.string(),
      }),
    });

    expect(cached('cached')).toBe('cached:1');
    expect(cached('cached')).toBe('cached:1');
  });

  it('cleans one cached value by params', () => {
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    expect(cached('a')).toBe('a:1');
    expect(cached('b')).toBe('b:2');

    cached.CleanCache('a');

    expect(cached('a')).toBe('a:3');
    expect(cached('b')).toBe('b:2');
  });

  it('cleans all cached values', () => {
    let callCount = 0;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => {
        callCount += 1;
        return `${key}:${callCount}`;
      },
    });

    expect(cached('a')).toBe('a:1');
    expect(cached('b')).toBe('b:2');

    cached.CleanAllCache();

    expect(cached('a')).toBe('a:3');
    expect(cached('b')).toBe('b:4');
  });

  it('dedupes in-flight async calls by key', async () => {
    let callCount = 0;
    let resolveValue!: (value: string) => void;
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: async (key: string) => {
        callCount += 1;
        return new Promise<string>(resolve => {
          resolveValue = resolve;
        }).then(value => `${key}:${value}`);
      },
    });

    const first = cached('a');
    const second = cached('a');

    expect(second).toBe(first);
    expect(callCount).toBe(1);

    resolveValue('resolved');

    await expect(first).resolves.toBe('a:resolved');
    expect(await cached('a')).toBe('a:resolved');
    expect(callCount).toBe(1);
  });

  it('drops in-flight async cache when cleaning by params', async () => {
    let callCount = 0;
    const resolveValues: Array<(value: string) => void> = [];
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: async (key: string) => {
        callCount += 1;
        return new Promise<string>(resolve => {
          resolveValues.push(resolve);
        }).then(value => `${key}:${value}`);
      },
    });

    const first = cached('a');
    cached.CleanCache('a');
    const second = cached('a');

    expect(second).not.toBe(first);
    expect(callCount).toBe(2);

    resolveValues[0]('old');
    resolveValues[1]('new');

    await expect(first).resolves.toBe('a:old');
    await expect(second).resolves.toBe('a:new');
    expect(await cached('a')).toBe('a:new');
    expect(callCount).toBe(2);
  });

  it('can clean before the first cached call', () => {
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => `${key}:value`,
    });

    expect(() => cached.CleanCache('a')).not.toThrow();
    expect(() => cached.CleanAllCache()).not.toThrow();
    expect(cached('a')).toBe('a:value');
  });

  it('saves storage after cleaning cache values', () => {
    const savedResults: unknown[] = [];
    const cached = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: (key: string) => `${key}:computed`,
      Storage: {
        AsyncLoad: false,
        ValueValidationZod: z.string(),
        Load: () => ({
          Context: {
            [JSON.stringify(['a'])]: true,
            [JSON.stringify(['b'])]: true,
          },
          CachedValueMap: {
            [JSON.stringify(['a'])]: 'a:stored',
            [JSON.stringify(['b'])]: 'b:stored',
          },
        }),
        Save: (context, cachedValueMap) => {
          savedResults.push({
            Context: context,
            CachedValueMap: { ...cachedValueMap },
          });
        },
      },
    });

    cached.CleanCache('a');

    expect(savedResults.at(-1)).toEqual({
      Context: {
        [JSON.stringify(['a'])]: true,
        [JSON.stringify(['b'])]: true,
      },
      CachedValueMap: {
        [JSON.stringify(['b'])]: 'b:stored',
      },
    });
  });

  it('keeps sync and async return types', () => {
    const CachedSyncFn = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: SyncFn,
    });

    const CachedAsyncFn = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: AsyncFn,
    });

    expectTypeOf(CachedSyncFn).toEqualTypeOf<(str: string, num: number) => string>();
    expectTypeOf(CachedAsyncFn).toEqualTypeOf<(str: string, num: number) => Promise<string>>();
    expectTypeOf(CachedSyncFn.CleanCache).toEqualTypeOf<(str: string, num: number) => void>();
    expectTypeOf(CachedSyncFn.CleanAllCache).toEqualTypeOf<() => void>();
  });
});
