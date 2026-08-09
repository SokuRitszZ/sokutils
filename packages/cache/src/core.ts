import { assign, keys } from 'es-toolkit/compat';
import { CacheCoreOptions, CacheFinalFunction, CacheFinalFunctionTools, NormalFunction } from './types';
import { CacheCoreBuildState } from './core/build-state';
import { CacheCoreBuildTools } from './core/build-tools';
import { CacheCoreLoadStorageCaller } from './core/load-storage';
import { CacheCoreSaveStorage } from './core/save-storage';

export const CacheCore =
  <F extends NormalFunction, Context, AsyncLoad extends boolean = false>
  (options: CacheCoreOptions<F, Context, AsyncLoad>)
    : CacheFinalFunction<F, AsyncLoad> & CacheFinalFunctionTools<F> => {
  type FinalFunction = CacheFinalFunction<F, AsyncLoad>;
  type FnParameters = Parameters<F>;

  const state = CacheCoreBuildState(options);
  const loadStorage = CacheCoreLoadStorageCaller(options, state);
  const tools = CacheCoreBuildTools(options, state, loadStorage);

  const getAndHandleResult = (...params: FnParameters): ReturnType<F> => {
    const key = options.KeyGenerator(...params);
    const strategyResult = options.Strategy.Match({ CurrentContext: state.Context, Key: key, Params: params });
    const defer = () => {
      state.Context = strategyResult.NextContext;
      if (strategyResult.PickedKeys) {
        const valuesMapKeys = keys(state.ValuesMap);
        valuesMapKeys.map(k => {
          if (strategyResult.PickedKeys?.includes(k)) {
            return;
          }
          delete state.ValuesMap[k];
        });
      }
      CacheCoreSaveStorage(options, state);
    };
    if (strategyResult.Hit && state.ValuesMap[key]) {
      defer();
      return state.ValuesMap[key] as ReturnType<F>;
    }
    else if (state.PromiseMap[key]) {
      return state.PromiseMap[key] as ReturnType<F>;
    }
    else {
      const result = options.Function(...params);
      if (result instanceof Promise) {
        state.PromiseMap[key] = result;
        result.then(r => {
          if (state.PromiseMap[key] !== result) {
            return;
          }
          delete state.PromiseMap[key];
          state.ValuesMap[key] = r;
          defer();
        }, () => {
          if (state.PromiseMap[key] === result) {
            delete state.PromiseMap[key];
          }
        });
      }
      else {
        state.ValuesMap[key] = result;
        defer();
      }
      return result;
    }
  };

  const wrappedFn = (...params: FnParameters) => {
    const loadResult = loadStorage();
    if (loadResult instanceof Promise) {
      return loadResult.then(() => getAndHandleResult(...params));
    }
    else {
      return getAndHandleResult(...params);
    }
  };

  const isLazy = options.Storage?.Lazy ?? true;
  if (!isLazy) {
    loadStorage();
  }

  assign(wrappedFn, tools);

  return wrappedFn as any as (FinalFunction & CacheFinalFunctionTools<F>);
  };
