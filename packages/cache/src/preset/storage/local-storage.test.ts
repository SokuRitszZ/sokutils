import { describe, expect, expectTypeOf, it, vi } from 'vitest';
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

class WindowLike {
  private listeners = new Map<string, (() => void)[]>();

  addEventListener(type: 'beforeunload', listener: () => void) {
    this.listeners.set(type, [...this.listeners.get(type) ?? [], listener]);
  }

  dispatch(type: 'beforeunload') {
    this.listeners.get(type)?.forEach(listener => listener());
  }
}

const createStorage = (options?: {
  storageLike?: MemoryStorage;
  windowLike?: WindowLike;
  syncMode?: 'debounce' | 'before-unload';
}) => CachePresetStorageLocalStorage({
  Key: 'local-storage.test.ts',
  LocalStorageLike: options?.storageLike ?? new MemoryStorage(),
  ContextValidationZod: z.record(z.string(), z.boolean()),
  ValueValidationZod: z.string(),
  SyncMode: options?.syncMode,
  WindowLike: options?.windowLike,
});

describe('[CachePresetStorageLocalStorage]', () => {
  it('loads and saves cache payloads after debounce delay', () => {
    vi.useFakeTimers();
    const storageLike = new MemoryStorage();
    const storage = createStorage({ storageLike });

    storage.Save({ a: true }, { a: 'value' });

    expect(storage.Load()).toBeUndefined();
    vi.advanceTimersByTime(500);
    expect(storage.Load()).toEqual({
      Context: { a: true },
      CachedValueMap: { a: 'value' },
    });
    vi.useRealTimers();
  });

  it('saves only on beforeunload in before-unload sync mode', () => {
    const storageLike = new MemoryStorage();
    const windowLike = new WindowLike();
    const storage = createStorage({
      storageLike,
      windowLike,
      syncMode: 'before-unload',
    });

    storage.Save({ a: true }, { a: 'value' });
    expect(storage.Load()).toBeUndefined();

    storage.Save({ b: false }, { b: 'next' });
    windowLike.dispatch('beforeunload');

    expect(storage.Load()).toEqual({
      Context: { b: false },
      CachedValueMap: { b: 'next' },
    });
  });

  it('can create before-unload mode storage without browser globals', () => {
    expect(() => createStorage({ syncMode: 'before-unload' })).not.toThrow();
  });

  it('returns undefined for invalid cache payloads', () => {
    const storageLike = new MemoryStorage();
    const storage = createStorage({ storageLike });

    storageLike.setItem('local-storage.test.ts', JSON.stringify({
      Context: {},
      CachedValueMap: 'not-a-record',
    }));

    expect(storage.Load()).toBeUndefined();

    storageLike.setItem('local-storage.test.ts', 'not-json');

    expect(storage.Load()).toBeUndefined();
  });

  it('has sync load type', () => {
    const storage = createStorage();

    expectTypeOf(storage.AsyncLoad).toEqualTypeOf<false>();
  });
});
