import { CacheCoreOptions, CacheCoreState, NormalFunction } from '../types';

export const CacheCoreBuildState = <F extends NormalFunction, Context, AsyncLoad extends boolean = false>
  (options: CacheCoreOptions<F, Context, AsyncLoad>): CacheCoreState<Context, Awaited<ReturnType<F>>> => {
  return {
    Context: options.Strategy.InitContext(),
    ValuesMap: {},
    PromiseMap: {},
  };
};
