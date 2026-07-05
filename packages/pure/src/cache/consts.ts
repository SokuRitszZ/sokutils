import { CacheDefineStrategy } from './define';
import { CachePresetStrategyOnce } from './preset/strategy/once';

export const CACHE_DEFAULT_KEY_GENERATOR = (...params: any[]) => JSON.stringify(params);
export const CACHE_DEFAULT_STRATEGY = CachePresetStrategyOnce();
