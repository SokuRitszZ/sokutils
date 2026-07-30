import { ZodMiniType } from 'zod/v4-mini';
import { debounce } from 'es-toolkit';
import { CacheDefineStorage } from '../../define';
import { CACHE_STORAGE_FORMAT_ZOD } from '../../consts';

interface CachePresetStorageIDBOptions {
  ContextValidationZod: ZodMiniType<any>;
  ValueValidationZod: ZodMiniType<any>;
  Key: string;
  IDBFactory?: IDBFactory;
}

const CONST_DATABASE_NAME = '@sokutils/pure';
const CONST_TABLE_NAME = 'cache/preset/storage/idb';

const waitRequest = <T>(request: IDBRequest<T>) => new Promise<T>((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const waitTransaction = (transaction: IDBTransaction) => new Promise<void>((resolve, reject) => {
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error);
  transaction.onabort = () => reject(transaction.error);
});

export const CachePresetStorageIDB = CacheDefineStorage((options: CachePresetStorageIDBOptions) => {
  const getIDBFactory = () => {
    const idb = options.IDBFactory ?? globalThis.indexedDB;

    if (!idb) {
      throw new Error('IndexedDB is not available. Pass IDBFactory when using CachePresetStorageIDB outside a browser.');
    }

    return idb;
  };

  const openDatabase = async () => {
    const idb = getIDBFactory();
    const request = idb.open(CONST_DATABASE_NAME);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(CONST_TABLE_NAME)) {
        database.createObjectStore(CONST_TABLE_NAME);
      }
    };

    const database = await waitRequest(request);

    if (database.objectStoreNames.contains(CONST_TABLE_NAME)) {
      return database;
    }

    const nextVersion = database.version + 1;
    database.close();

    const upgradeRequest = idb.open(CONST_DATABASE_NAME, nextVersion);
    upgradeRequest.onupgradeneeded = () => {
      upgradeRequest.result.createObjectStore(CONST_TABLE_NAME);
    };

    return waitRequest(upgradeRequest);
  };

  return {
    AsyncLoad: true,
    ValueValidationZod: options.ValueValidationZod,
    ContextValidationZod: options.ContextValidationZod,
    Load: async () => {
      const database = await openDatabase();
      const transaction = database.transaction(CONST_TABLE_NAME, 'readonly');
      const rawValue = await waitRequest(transaction.objectStore(CONST_TABLE_NAME).get(options.Key));

      database.close();
      return CACHE_STORAGE_FORMAT_ZOD.safeParse(rawValue).data;
    },
    Save: debounce(async (context, cachedValueMap) => {
      const database = await openDatabase();
      const transaction = database.transaction(CONST_TABLE_NAME, 'readwrite');

      transaction.objectStore(CONST_TABLE_NAME).put({
        Context: context,
        CachedValueMap: cachedValueMap,
      }, options.Key);

      await waitTransaction(transaction);
      database.close();
    }, 1000),
  };
});
