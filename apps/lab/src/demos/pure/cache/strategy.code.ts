import { CACHE_DEFAULT_KEY_GENERATOR, CacheCore, CachePresetStrategyExpireAt, CachePresetStrategyLRU, CachePresetStrategyTimeout } from '@sokutils/pure';

// demo-code:start
type Mode = 'lru' | 'timeout' | 'expireAt';

let callCount = 0;

export const createCachedByStrategy = (mode: Mode) => {
  const strategy = {
    lru: CachePresetStrategyLRU(2),
    timeout: CachePresetStrategyTimeout(2000),
    expireAt: CachePresetStrategyExpireAt(Date.now() + 3000),
  }[mode];

  return CacheCore({
    KeyGenerator: CACHE_DEFAULT_KEY_GENERATOR,
    Strategy: strategy,
    Function: (key: string) => {
      callCount += 1;
      return `${key}:${callCount}`;
    },
  });
};

const cached = createCachedByStrategy('lru');

export const runStrategyExample = () => {
  cached('a'); // a:1
  cached('b'); // b:2
  cached('a'); // a:1
  cached('c'); // c:3, evicts b
};
// demo-code:end

export const resetStrategyCallCount = () => {
  callCount = 0;
};
export const getStrategyCallCount = () => callCount;
