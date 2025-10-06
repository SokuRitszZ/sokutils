import { cloneDeep } from 'lodash-es';
import hash from 'object-hash';
import { CacheSettings, FnType, CachedFn } from './types';

const _default: CacheSettings<FnType> = {
  key: (params) => hash(params, { ignoreUnknown: false }),
  strategy: (_, ctx: any) => { 
    return {
      hit: true,
      ctx,
    };
  },
};

export const core = <Fn extends FnType>(fn: Fn): CachedFn<Fn> => {
  type P = Parameters<Fn>;
  type R = ReturnType<Fn>;
  const settings = cloneDeep(_default);
  const valueMap: Record<string, R> = {};

  let ctx: any;

  const cachedFn = (...params: P): R => {
    const key = settings.key(params);
    const strategy = settings.strategy(key, ctx);

    ctx = strategy.ctx;
    
    if (strategy.hit && key in valueMap) {
      return valueMap[key];
    }

    const result = fn(...params);

    valueMap[key] = result;

    return result;
  };
  
  // settings change
  const resolved = new Proxy(cachedFn, {
    get: (_, key) => {
      return (setting: any) => {
        settings[key] = setting;
        return resolved;
      };
    },
  }) as CachedFn<Fn>;

  return resolved;
};