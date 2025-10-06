
export type FnType = (...args: any[]) => any;

export interface CacheSettings<Fn extends FnType> {
  key: (params: Parameters<Fn>) => string;
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

export type FnSettings<Fn extends FnType> = {
  [K in keyof CacheSettings<Fn>]: (setting: CacheSettings<Fn>[K]) => CachedFn<Fn>;
};

export type CachedFn<Fn extends FnType> = Fn & FnSettings<Fn>;