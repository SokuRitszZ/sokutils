import { CacheBuild, CachePresetStorageLocalStorage } from '@sokutils/cache';
import { z } from 'zod/v4-mini';

// demo-code:start
let callCount = 0;

const cached = CacheBuild()
  .Function((id: string) => {
    callCount += 1;
    return `${id}:${crypto.randomUUID().slice(0, 8)}`;
  })
  .Storage(CachePresetStorageLocalStorage({
    Key: 'lab:pure:cache:builder',
    LocalStorageLike: localStorage,
    ValueValidationZod: z.string(),
  }))
  .Build();

export const runBuilderExample = () => {
  cached('u-001');
  cached('u-001'); // Same value after first call.
};
// demo-code:end

export const callCachedBuilder = (id: string) => cached(id);
export const getBuilderCallCount = () => callCount;
export const clearCachedBuilder = () => localStorage.removeItem('lab:pure:cache:builder');
