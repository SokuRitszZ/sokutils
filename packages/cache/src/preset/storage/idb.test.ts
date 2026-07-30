import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { IDBFactory as FakeIDBFactory } from 'fake-indexeddb';
import { z } from 'zod/v4-mini';
import { CachePresetStorageIDB } from './idb';

describe('[CachePresetStorageIDB]', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const putRawValue = async (idb: IDBFactory, key: string, value: unknown) => {
    const openRequest = idb.open('@sokutils/pure');
    openRequest.onupgradeneeded = () => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains('cache/preset/storage/idb')) {
        database.createObjectStore('cache/preset/storage/idb');
      }
    };
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      openRequest.onsuccess = () => resolve(openRequest.result);
      openRequest.onerror = () => reject(openRequest.error);
    });
    const transaction = database.transaction('cache/preset/storage/idb', 'readwrite');
    transaction.objectStore('cache/preset/storage/idb').put(value, key);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    database.close();
  };

  it('loads and saves cache payloads with an injected IDBFactory', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const storage = CachePresetStorageIDB({
      Key: 'idb.test.ts',
      IDBFactory: new FakeIDBFactory() as unknown as IDBFactory,
      ValueValidationZod: z.string(),
    });

    await storage.Save({ a: true }, { a: 'value' });
    await vi.advanceTimersByTimeAsync(1000);

    await expect(storage.Load()).resolves.toEqual({
      Context: { a: true },
      CachedValueMap: { a: 'value' },
    });
  });

  it('returns undefined for missing or invalid cache payloads', async () => {
    const idb = new FakeIDBFactory() as unknown as IDBFactory;
    const storage = CachePresetStorageIDB({
      Key: 'idb-invalid.test.ts',
      IDBFactory: idb,
      ValueValidationZod: z.string(),
    });

    await expect(storage.Load()).resolves.toBeUndefined();

    await putRawValue(idb, 'idb-invalid.test.ts', {
      Context: {},
      CachedValueMap: 'not-a-record',
    });

    await expect(storage.Load()).resolves.toBeUndefined();
  });

  it('has async load type', () => {
    const storage = CachePresetStorageIDB({
      Key: 'idb.test.ts',
      IDBFactory: new FakeIDBFactory() as unknown as IDBFactory,
      ValueValidationZod: z.string(),
    });

    expectTypeOf(storage.AsyncLoad).toEqualTypeOf<true>();
    expectTypeOf(storage.Load).returns.resolves.toBeNullable();
  });
});
