import { CacheCoreOptions, CacheCoreState, NormalFunction } from '../types';

export const CacheCoreSaveStorage =
  (options: CacheCoreOptions<NormalFunction, any, boolean>, state: CacheCoreState<any, any>) => {
    options.Storage?.Save(state.Context, state.ValuesMap);
  };
