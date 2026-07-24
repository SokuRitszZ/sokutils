import { z, ZodMiniType } from 'zod/v4-mini';

export type NormalFunction<Params extends any[] = any[], Result = any> = (...args: Params) => Result;

export interface CacheCoreOptions<F extends NormalFunction, Context, AsyncLoad extends boolean> {
  Function: F;
  Strategy: CacheStrategy<Context>;
  KeyGenerator: CacheKeyGenerator<F>;
  Storage?: CacheStorage<AsyncLoad>;
}

export type CacheBuilder<F extends NormalFunction, Context, AsyncLoad extends boolean> = {
  Strategy: <NextContext>(strategy: CacheStrategy<NextContext>) => CacheBuilder<F, NextContext, AsyncLoad>;
  Storage: <NextAsyncLoad extends boolean>(storage: CacheStorage<NextAsyncLoad>) => CacheBuilder<F, Context, NextAsyncLoad>;
  Function: <NextF extends NormalFunction>(fn: NextF) => CacheBuilder<NextF, Context, AsyncLoad>;
  KeyGenerator: (keyFn: CacheKeyGenerator<F>) => CacheBuilder<F, Context, AsyncLoad>;
  Build: () => CacheFinalFunction<F, AsyncLoad>;
}

export type CacheFinalFunction<F extends NormalFunction, AsyncLoad extends boolean> =
  AsyncLoad extends true ? (...params: Parameters<F>) => Promise<Awaited<ReturnType<F>>> : F;

export type CacheStrategy<Context> = {
  InitContext: () => Context;
  Match: (params: CacheStrategyMatchParams<Context>) => CacheStrategyMatchResult<Context>;
}

export type CacheStorage<AsyncLoad extends boolean> = {
  ContextValidationZod: ZodMiniType<any>;
  ValueValidationZod: ZodMiniType<any>;
  AsyncLoad: AsyncLoad;
  Load: AsyncLoad extends false ? () => CacheStorageLoadResult | undefined : () => Promise<CacheStorageLoadResult | undefined>;
  Save: (context: any, cachedValueMap: Record<string, any>) => void;
}

export type CacheStorageLoadResult<F extends NormalFunction = () => any, Context = any> = {
  Context: Context;
  CachedValueMap: Record<string, Awaited<ReturnType<F>>>;
}

export type CacheKeyGenerator<F extends NormalFunction> = (...params: Parameters<F>) => string;

export type CacheStrategyMatchParams<Context> = {
  Key: string;
  Params: any[];
  CurrentContext: Context;
}

export type CacheStrategyMatchResult<Context> = {
  Hit: boolean;
  NextContext: Context;
  PickedKeys?: string[];
}
