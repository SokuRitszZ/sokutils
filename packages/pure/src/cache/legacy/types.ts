import { NormalFunction } from '../../types';

export interface CacheSettings<F extends NormalFunction> {
  key: (params: Parameters<F>) => string;
  strategy: CacheStrategy;
}

export type CacheStrategy =(key: string, ctx: any | undefined) => CacheStrategyResult;
export interface CacheStrategyParams<C> {
  key: string;
  ctx?: C;
}

export interface CacheStrategyResult {
  hit: boolean;
  ctx: any;
}

export type FnSettings<F extends NormalFunction> = {
  [K in keyof CacheSettings<F>]: (setting: CacheSettings<F>[K]) => CachedFn<F>;
};

export type CachedFn<F extends NormalFunction> = F & FnSettings<F>;
