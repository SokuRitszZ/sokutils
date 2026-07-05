import { once, pick } from 'es-toolkit';
import { z } from 'zod/v4-mini';
import { NormalFunction } from '../types';
import { CacheCoreOptions, CacheFinalFunction, CacheStorage, CacheStorageLoadResult, CacheStrategy } from './types';

export const CacheCore =
  <F extends NormalFunction, Context, AsyncLoad extends boolean = false>
  (options: CacheCoreOptions<F, Context, AsyncLoad>)
    : CacheFinalFunction<F, AsyncLoad> => {
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
    const contextValidation = options.Storage?.ContextValidationZod.safeParse(result.Context);
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

  const getAndHandleResult = (...params: FnParameters): ReturnType<F> => {
    const key = options.KeyGenerator(...params);
    const strategyResult = options.Strategy.Match({ CurrentContext: context, Key: key, Params: params });
    const defer = () => {
      context = strategyResult.NextContext;
      if (strategyResult.PickedKeys) {
        valuesMap = pick(valuesMap, strategyResult.PickedKeys);
      }
      options.Storage?.Save(context, valuesMap as Record<string, FinalType>);
    };
    if (strategyResult.Hit) {
      defer();
      return valuesMap[key] as ReturnType<F>;
    }
    else {
      const result = options.Function(...params);
      valuesMap[key] = result;
      defer();
      return result as ReturnType<F>;
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

  return wrappedFn as FinalFunction;
  };
