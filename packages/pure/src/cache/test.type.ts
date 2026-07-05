import { z } from 'zod/v4-mini';
import { CACHE_DEFAULT_KEY_GENERATOR, CACHE_DEFAULT_STRATEGY } from './consts';
import { CacheCore } from './core';
import { CachePresetStorageIDB, CachePresetStorageLocalStorage } from './preset';

const SyncFn = (str: string, num: number) => {
  return str + num;
};

const AsyncFn = async (str: string, num: number) => {
  return str + num;
};

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

const SyncStorage = CachePresetStorageLocalStorage({
  Key: 'test.type.ts',
  LocalStorageLike: localStorage,
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.string(),
});

const AsyncStorage = CachePresetStorageIDB({
  Key: 'test.type.ts',
  IDBFactory: indexedDB,
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.number(),
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

const CachedAsyncFnWithASyncStorage = CacheCore({
  KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
  Strategy: CACHE_DEFAULT_STRATEGY,
  Function: AsyncFn,
  Storage: AsyncStorage,
});
