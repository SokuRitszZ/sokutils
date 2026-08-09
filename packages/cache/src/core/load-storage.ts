import { z } from 'zod/v4-mini';
import { once } from 'es-toolkit';
import { CacheCoreOptions, CacheCoreState, CacheStorageLoadResult, NormalFunction } from '../types';

export const CacheCoreLoadStorageCaller = <F extends NormalFunction, Context, AsyncLoad extends boolean = false>
  (options: CacheCoreOptions<F, Context, AsyncLoad>, state: CacheCoreState<Context, Awaited<ReturnType<F>>>) => {
  type StorageLoadResult = CacheStorageLoadResult<F, Context>;
  const init = once(() => {
    const initResult = options.Storage?.Load();
    const loadSync = (result?: StorageLoadResult) => {
      if (!result) {
        return;
      }
      const contextValidation = options.Strategy.ContextValidationZod.safeParse(result.Context);
      const valuesMapValidation = z.record(z.string(), options.Storage!.ValueValidationZod).safeParse(result.CachedValueMap);
      if (contextValidation.data) {
        state.Context = contextValidation.data;
      }
      if (valuesMapValidation.data) {
        state.ValuesMap = valuesMapValidation.data ?? {};
      }
    };
    return initResult instanceof Promise ? initResult.then(loadSync) : loadSync(initResult);
  });

  return () => {
    if (!options.Storage) {
      return;
    }
    return init();
  };
};
