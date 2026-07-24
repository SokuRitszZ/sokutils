import { describe, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4-mini';
import {
  CACHE_DEFAULT_KEY_GENERATOR,
  CACHE_DEFAULT_STRATEGY,
  CacheCore,
  CachePresetStorageIDB,
  CachePresetStorageLocalStorage,
} from '.';

const SyncFn = (str: string, num: number) => {
  return str + num;
};

const AsyncFn = async (str: string, num: number) => {
  return str + num;
};

const StorageLike = {} as Storage;
const IDBFactoryLike = {} as IDBFactory;

const SyncStorage = CachePresetStorageLocalStorage({
  Key: 'index.test.ts',
  LocalStorageLike: StorageLike,
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.string(),
});

const AsyncStorage = CachePresetStorageIDB({
  Key: 'index.test.ts',
  IDBFactory: IDBFactoryLike,
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.string(),
});

describe('[cache/index]', () => {
  it('keeps cache function types by function and storage async mode', () => {
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

    const CachedSyncFnWithSyncStorage = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: SyncFn,
      Storage: SyncStorage,
    });

    const CachedSyncFnWithAsyncStorage = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: SyncFn,
      Storage: AsyncStorage,
    });

    const CachedAsyncFnWithSyncStorage = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: AsyncFn,
      Storage: SyncStorage,
    });

    const CachedAsyncFnWithAsyncStorage = CacheCore({
      KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
      Strategy: CACHE_DEFAULT_STRATEGY,
      Function: AsyncFn,
      Storage: AsyncStorage,
    });

    expectTypeOf(CachedSyncFn).toEqualTypeOf<(str: string, num: number) => string>();
    expectTypeOf(CachedAsyncFn).toEqualTypeOf<(str: string, num: number) => Promise<string>>();
    expectTypeOf(CachedSyncFnWithSyncStorage).toEqualTypeOf<(str: string, num: number) => string>();
    expectTypeOf(CachedSyncFnWithAsyncStorage).toEqualTypeOf<(str: string, num: number) => Promise<string>>();
    expectTypeOf(CachedAsyncFnWithSyncStorage).toEqualTypeOf<(str: string, num: number) => Promise<string>>();
    expectTypeOf(CachedAsyncFnWithAsyncStorage).toEqualTypeOf<(str: string, num: number) => Promise<string>>();
  });
});
