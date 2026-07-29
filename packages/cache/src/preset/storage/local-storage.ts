import { debounce } from 'es-toolkit/compat';
import { ZodMiniType } from 'zod/v4-mini';
import { CACHE_STORAGE_FORMAT_ZOD } from '../../consts';
import { CacheDefineStorage } from '../../define';
import { unwrap } from '../../utils';

export type CachePresetStorageLocalStorageSyncMode = 'debounce' | 'before-unload';

export interface CachePresetStorageLocalStorageWindowLike {
  addEventListener: (type: 'beforeunload', listener: () => void) => void;
}

interface CachePresetStorageLocalStorageOptions {
  ContextValidationZod: ZodMiniType<any>;
  ValueValidationZod: ZodMiniType<any>;
  Key: string;
  LocalStorageLike: Storage;
  SyncMode?: CachePresetStorageLocalStorageSyncMode;
  WindowLike?: CachePresetStorageLocalStorageWindowLike;
}

const getGlobalWindowLike = (): CachePresetStorageLocalStorageWindowLike | undefined => {
  const maybeGlobal = globalThis as Partial<CachePresetStorageLocalStorageWindowLike>;
  return typeof maybeGlobal.addEventListener === 'function'
    ? maybeGlobal as CachePresetStorageLocalStorageWindowLike
    : undefined;
};

const createSave = (options: CachePresetStorageLocalStorageOptions) => {
  const save = (value: string) => options.LocalStorageLike.setItem(options.Key, value);

  if (options.SyncMode !== 'before-unload') {
    const debounceSave = debounce(save, 500);
    return (value: string) => debounceSave(value);
  }

  const windowLike = options.WindowLike ?? getGlobalWindowLike();
  let pendingValue = '';
  let dirty = false;

  windowLike?.addEventListener('beforeunload', () => {
    if (dirty) {
      save(pendingValue);
      dirty = false;
    }
  });

  return (value: string) => {
    pendingValue = value;
    dirty = true;
  };
};

export const CachePresetStorageLocalStorage = CacheDefineStorage((options: CachePresetStorageLocalStorageOptions) => {
  const save = createSave(options);

  return {
    AsyncLoad: false,
    ValueValidationZod: options.ValueValidationZod,
    ContextValidationZod: options.ContextValidationZod,
    Load: () => {
      const rawValue = options.LocalStorageLike.getItem(options.Key) || '';
      const rawParsedValue = unwrap(() => JSON.parse(rawValue));
      const validation = CACHE_STORAGE_FORMAT_ZOD.safeParse(rawParsedValue);
      return validation.data;
    },
    Save: (context, cachedValueMap) => {
      const stringified = unwrap(() => JSON.stringify({
        Context: context,
        CachedValueMap: cachedValueMap,
      }));
      save(stringified || '');
    },
  };
});
