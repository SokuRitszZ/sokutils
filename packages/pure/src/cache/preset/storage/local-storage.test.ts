import { describe, expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod/v4-mini';
import { CachePresetStorageLocalStorage } from './local-storage';

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

describe('[CachePresetStorageLocalStorage]', () => {
  it('loads and saves cache payloads', () => {
    const storageLike = new MemoryStorage();
    const storage = CachePresetStorageLocalStorage({
      Key: 'local-storage.test.ts',
      LocalStorageLike: storageLike,
      ContextValidationZod: z.record(z.string(), z.boolean()),
      ValueValidationZod: z.string(),
    });

    storage.Save({ a: true }, { a: 'value' });

    expect(storage.Load()).toEqual({
      Context: { a: true },
      CachedValueMap: { a: 'value' },
    });
  });

  it('returns undefined for invalid cache payloads', () => {
    const storageLike = new MemoryStorage();
    const storage = CachePresetStorageLocalStorage({
      Key: 'local-storage-invalid.test.ts',
      LocalStorageLike: storageLike,
      ContextValidationZod: z.record(z.string(), z.boolean()),
      ValueValidationZod: z.string(),
    });

    storageLike.setItem('local-storage-invalid.test.ts', JSON.stringify({
      Context: {},
      CachedValueMap: 'not-a-record',
    }));

    expect(storage.Load()).toBeUndefined();

    storageLike.setItem('local-storage-invalid.test.ts', 'not-json');

    expect(storage.Load()).toBeUndefined();
  });

  it('has sync load type', () => {
    const storage = CachePresetStorageLocalStorage({
      Key: 'local-storage.test.ts',
      LocalStorageLike: new MemoryStorage(),
      ContextValidationZod: z.record(z.string(), z.boolean()),
      ValueValidationZod: z.string(),
    });

    expectTypeOf(storage.AsyncLoad).toEqualTypeOf<false>();
  });
});
