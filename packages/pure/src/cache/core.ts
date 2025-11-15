import { assign, cloneDeep } from 'lodash-es';
import hash from 'object-hash';
import { Fn } from '../types';
import { CacheSettings, CacheStrategy, CachedFn } from './types';
import { strategy } from './strategy';

const _default: CacheSettings<Fn> = {
  key: (params) => hash(params, { ignoreUnknown: false }),
  strategy: (_, ctx: any) => { 
    return {
      hit: true,
      ctx,
    };
  },
};

export const core = <F extends Fn>(fn: F): CachedFn<F> => {
  type P = Parameters<F>;
  type R = ReturnType<F>;
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
  }) as CachedFn<F>;

  return resolved;
};

export const build = () => {
  let stra: CacheStrategy;

  const wrap = <F extends Fn>(f: F): F => {
    return stra ? core(f).strategy(stra) : core(f);
  };

  const _strategy = (_stra: CacheStrategy) => {
    stra = _stra;
    return wrap;
  };

  wrap.strategy = _strategy;

  return wrap;
};