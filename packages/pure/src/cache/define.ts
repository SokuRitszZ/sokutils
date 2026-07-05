import { NormalFunction } from '../types';
import { CacheStorage, CacheStrategy } from './types';

export const CacheDefineStrategy = <BuilderParams extends any[]>(builder: <F extends NormalFunction, Context>(...params: BuilderParams) => CacheStrategy<F, Context>) => builder;

export const CacheDefineStorage =
  <BuilderParams extends any[], AsyncLoad extends boolean>
  (builder: (...params: BuilderParams) => CacheStorage<AsyncLoad>) => builder;
