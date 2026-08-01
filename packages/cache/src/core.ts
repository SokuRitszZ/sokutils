import { once } from 'es-toolkit';
import { z } from 'zod/v4-mini';
import { keys } from 'es-toolkit/compat';
import { CacheCoreOptions, CacheFinalFunction, CacheFinalFunctionTools, CacheStorageLoadResult, NormalFunction } from './types';

export const CacheCore =
  <F extends NormalFunction, Context, AsyncLoad extends boolean = false>
  (options: CacheCoreOptions<F, Context, AsyncLoad>)
    : CacheFinalFunction<F, AsyncLoad> & CacheFinalFunctionTools<F> => {
  type FinalType = Awaited<ReturnType<F>>;
  type FnParameters = Parameters<F>;
  type FinalFunction = CacheFinalFunction<F, AsyncLoad>;
  type StorageLoadResult = CacheStorageLoadResult<F, Context>;

  let context: Context;
  let valuesMap: Partial<Record<string, FinalType>>;

  const fallbackInit = () => {
    context = options.Strategy.InitContext();
    valuesMap = {};
  };

  const loadStorage = (result: StorageLoadResult) => {
    if (!options.Storage) {
      fallbackInit();
      return;
    }
    const contextValidation = options.Strategy.ContextValidationZod.safeParse(result.Context);
    const valuesMapValidation = z.record(z.string(), options.Storage.ValueValidationZod).safeParse(result.CachedValueMap);
    context = contextValidation.data ?? options.Strategy.InitContext();
    valuesMap = valuesMapValidation.data ?? {};
  };
  const loadStorageResultSync = (result: StorageLoadResult | undefined) => {
    return result ? loadStorage(result) : fallbackInit();
  };
  const initStorage = once(() => {
    const initResult = options.Storage?.Load();
    return initResult instanceof Promise ? initResult.then(loadStorageResultSync) : loadStorageResultSync(initResult);
  });
  const saveStorage = () => {
    options.Storage?.Save(context, valuesMap as Record<string, FinalType>);
  };

  const getAndHandleResult = (...params: FnParameters): ReturnType<F> => {
    const key = options.KeyGenerator(...params);
    const strategyResult = options.Strategy.Match({ CurrentContext: context, Key: key, Params: params });
    const defer = () => {
      context = strategyResult.NextContext;
      if (strategyResult.PickedKeys) {
        const valuesMapKeys = keys(valuesMap);
        valuesMapKeys.map(k => {
          if (strategyResult.PickedKeys?.includes(k)) {
            return;
          }
          delete valuesMap[k];
        });
      }
      saveStorage();
    };
    if (strategyResult.Hit && valuesMap[key]) {
      defer();
      return valuesMap[key] as ReturnType<F>;
    }
    else {
      const result = options.Function(...params);
      if (result instanceof Promise) {
        result.then(r => {
          valuesMap[key] = r;
          defer();
        });
      }
      else {
        valuesMap[key] = result;
        defer();
      }
      return result;
    }
  };

  const wrappedFn = (...params: FnParameters) => {

    const loadResult = initStorage();
    if (loadResult instanceof Promise) {
      return loadResult.then(() => getAndHandleResult(...params));
    }
    else {
      return getAndHandleResult(...params);
    }
  };

  const CleanCache = (...args: FnParameters) => {
    const key = options.KeyGenerator(...args);
    const clean = () => {
      delete valuesMap[key];
      saveStorage();
    };
    const loadResult = initStorage();

    if (loadResult instanceof Promise) {

      loadResult.then(clean);
    }
    else {
      clean();
    }
  };

  const CleanAllCache = () => {
    const clean = () => {
      keys(valuesMap).map(k => {
        delete valuesMap[k];
      });
      saveStorage();
    };
    const loadResult = initStorage();

    if (loadResult instanceof Promise) {
      loadResult.then(clean);
    }
    else {
      clean();
    }
  };

  wrappedFn.CleanCache = CleanCache;
  wrappedFn.CleanAllCache = CleanAllCache;

  return wrappedFn as any as (FinalFunction & CacheFinalFunctionTools<F>);
  };
