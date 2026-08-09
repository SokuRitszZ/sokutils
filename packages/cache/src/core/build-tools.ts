import { keys } from 'es-toolkit/compat';
import { CacheCoreOptions, CacheCoreState, NormalFunction } from '../types';
import { CacheCoreSaveStorage } from './save-storage';

export const CacheCoreBuildTools =
  (
    options: CacheCoreOptions<NormalFunction, any, boolean>,
    state: CacheCoreState<any, any>,
    loadStorage: () => void | Promise<void>,
  ) => {
    type FnParameters = any[];
    const CleanCache = (...args: FnParameters) => {
      const key = options.KeyGenerator(...args);
      const clean = () => {
        delete state.ValuesMap[key];
        delete state.PromiseMap[key];

        CacheCoreSaveStorage(options, state);
      };
      const loadResult = loadStorage();
      if (loadResult instanceof Promise) {
        loadResult.then(clean);
      }
      else {
        clean();
      }
    };

    const CleanAllCache = () => {
      const clean = () => {
        keys(state.ValuesMap).map(k => {
          delete state.ValuesMap[k];
        });
        keys(state.PromiseMap).map(k => {
          delete state.PromiseMap[k];
        });
        CacheCoreSaveStorage(options, state);
      };
      const loadResult = loadStorage();
      if (loadResult instanceof Promise) {
        loadResult.then(clean);
      }
      else {
        clean();
      }
    };

    return {
      CleanCache,
      CleanAllCache,
    };
  };
