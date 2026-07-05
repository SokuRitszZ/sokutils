import { CACHE_DEFAULT_CORE_OPTIONS } from './consts';
import { CacheCore } from './core';
import { CacheBuilder } from './types';

export const CacheBuild = (options = CACHE_DEFAULT_CORE_OPTIONS()): CacheBuilder<() => void, Record<string, boolean>, false> => {
  return new Proxy(options, {
    get: (_, key) => {
      if (key === 'Build') {
        return () => CacheCore(options);
      }
      else {
        return (value: any) => {
          return CacheBuild({
            ...options,
            [key]: value,
          });
        };
      }
    },
  }) as any;
};
