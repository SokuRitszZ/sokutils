import { debounce } from 'es-toolkit/compat';

export type CachePresetStorageIDBSyncMode = 'debounce' | 'before-unload';

export interface CachePresetStorageIDBWindowLike {
  addEventListener: (type: 'beforeunload', listener: () => void) => void;
}

interface CachePresetStorageIDBSaveOptions {
  Key: string;
  ObjectStoreName: string;
  OpenDatabase: () => Promise<IDBDatabase>;
  SyncMode?: CachePresetStorageIDBSyncMode;
  WindowLike?: CachePresetStorageIDBWindowLike;
}

type SaveArgs = [context: unknown, cachedValueMap: Record<string, unknown>];

const waitTransaction = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error);
});

const getGlobalWindowLike = (): CachePresetStorageIDBWindowLike | undefined => {
  const maybeGlobal = globalThis as Partial<CachePresetStorageIDBWindowLike>;
  return typeof maybeGlobal.addEventListener === 'function'
    ? maybeGlobal as CachePresetStorageIDBWindowLike
    : undefined;
};

export const createCachePresetStorageIDBSave = (options: CachePresetStorageIDBSaveOptions) => {
  const save = async (...[context, cachedValueMap]: SaveArgs) => {
    const database = await options.OpenDatabase();
    const transaction = database.transaction(options.ObjectStoreName, 'readwrite');

    transaction.objectStore(options.ObjectStoreName).put({
      Context: context,
      CachedValueMap: cachedValueMap,
    }, options.Key);

    await waitTransaction(transaction);
    database.close();
  };

  if (options.SyncMode !== 'before-unload') {
    return debounce(save, 1000);
  }

  const windowLike = options.WindowLike ?? getGlobalWindowLike();
  let pendingArgs: SaveArgs | undefined;

  windowLike?.addEventListener('beforeunload', () => {
    if (pendingArgs) {
      const args = pendingArgs;
      pendingArgs = undefined;
      void save(...args);
    }
  });

  return (...args: SaveArgs) => {
    pendingArgs = args;
  };
};
