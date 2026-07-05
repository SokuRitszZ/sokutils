import { z } from 'zod/v4-mini';
import { CachePresetStrategyOnce } from './preset/strategy/once';
import { CacheDefineCoreOption } from './define';

export const CACHE_DEFAULT_KEY_GENERATOR = (...params: any[]) => JSON.stringify(params);
export const CACHE_DEFAULT_STRATEGY = CachePresetStrategyOnce();
export const CACHE_STORAGE_FORMAT_ZOD = z.object({
  Context: z.any(),
  CachedValueMap: z.record(z.string(), z.any()),
});
export const CACHE_DEFAULT_CORE_OPTIONS = CacheDefineCoreOption(() => {
  return {
    Strategy: CACHE_DEFAULT_STRATEGY,
    Function: () => {},
    KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
  };
});
