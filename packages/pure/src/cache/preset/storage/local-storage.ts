import { ZodMiniType } from 'zod/v4-mini';
import { CacheDefineStorage } from '../../define';
import { unwrap } from '../../../functions';

interface CachePresetStorageLocalStorageOptions {
  ContextValidationZod: ZodMiniType<any>;
  ValueValidationZod: ZodMiniType<any>;
  Key: string;
  LocalStorageLike: Storage;
}

export const CachePresetStorageLocalStorage = CacheDefineStorage((options: CachePresetStorageLocalStorageOptions) => {
  return {
    AsyncLoad: false,
    ValueValidationZod: options.ValueValidationZod,
    ContextValidationZod: options.ContextValidationZod,
    Load: () => {
      const rawValue = options.LocalStorageLike.getItem(options.Key) || '';
      const rawParsedValue = unwrap(() => JSON.parse(rawValue));

      return {
        Context: rawParsedValue?.Context,
        CachedValueMap: rawParsedValue?.CacheValueMap,
      };
    },
    Save: (context, cachedValueMap) => {
      const stringified = unwrap(() => JSON.stringify({
        Context: context,
        CachedValueMap: cachedValueMap,
      }));
      options.LocalStorageLike.setItem(options.Key, stringified || '');
    },
  };
});
