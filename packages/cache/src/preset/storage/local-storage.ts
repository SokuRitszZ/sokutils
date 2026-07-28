import { ZodMiniType } from 'zod/v4-mini';
import { debounce } from 'es-toolkit/compat';
import { CacheDefineStorage } from '../../define';
import { unwrap } from '../../utils';
import { CACHE_STORAGE_FORMAT_ZOD } from '../../consts';

interface CachePresetStorageLocalStorageOptions {
  ContextValidationZod: ZodMiniType<any>;
  ValueValidationZod: ZodMiniType<any>;
  Key: string;
  LocalStorageLike: Storage;
}


export const CachePresetStorageLocalStorage = CacheDefineStorage((options: CachePresetStorageLocalStorageOptions) => {
  const debounceSave = debounce((key: string, value: string) => options.LocalStorageLike.setItem(key, value), 500);

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
      debounceSave(options.Key, stringified || '');
    },
  };
});
