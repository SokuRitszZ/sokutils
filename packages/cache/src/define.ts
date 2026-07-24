import { CacheCoreOptions, CacheStorage, CacheStrategy, NormalFunction } from './types';

export const CacheDefineStrategy = <BuilderParams extends any[], Context>(builder: (...params: BuilderParams) => CacheStrategy<Context>) => builder;

export const CacheDefineStorage =
  <BuilderParams extends any[], AsyncLoad extends boolean>
  (builder: (...params: BuilderParams) => CacheStorage<AsyncLoad>) => builder;

export const CacheDefineCoreOption = <BuilderParams extends any[], F extends NormalFunction, Context, AsyncLoad extends boolean>(builder: (...params: BuilderParams) => CacheCoreOptions<F, Context, AsyncLoad>) => builder;
