import { CACHE_DEFAULT_KEY_GENERATOR, CacheCore, CachePresetStrategyOnce } from '@sokutils/pure';

// demo-code:start
let callCount = 0;

const cached = CacheCore({
  KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
  Strategy: CachePresetStrategyOnce(),
  Function: (name: string) => {
    callCount += 1;
    return `${name}:${callCount}`;
  },
});

export const runBasicExample = () => {
  cached('alpha'); // alpha:1
  cached('alpha'); // alpha:1
  cached('beta'); // beta:2
};
// demo-code:end

export const callCachedBasic = (key: string) => cached(key);
export const getBasicCallCount = () => callCount;
