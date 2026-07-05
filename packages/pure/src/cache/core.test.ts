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
        ContextValidationZod: z.record(z.string(), z.boolean()),
        ValueValidationZod: z.string(),
      }),
    });

    expect(cached('cached', 1)).toBe('from-storage');
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
        ContextValidationZod: z.record(z.string(), z.boolean()),
        ValueValidationZod: z.string(),
      }),
    });

    expect(cached('cached')).toBe('cached:1');
    expect(cached('cached')).toBe('cached:1');
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
  });
});
