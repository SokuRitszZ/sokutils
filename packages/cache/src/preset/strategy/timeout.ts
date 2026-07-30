import { z } from 'zod/v4-mini';
import { CacheDefineStrategy } from '../../define';

export const CachePresetStrategyTimeout = CacheDefineStrategy((timeout: number) => {
  return {
    InitContext: () => ({}) as Record<string, number>,
    Match: (params) => {
      const now = Date.now();
      const hasTimestamp = params.Key in params.CurrentContext;
      const timestamp = params.CurrentContext[params.Key] ?? 0;
      const hit = hasTimestamp && now - timestamp <= timeout;
      const nextContext = {
        ...params.CurrentContext,
        [params.Key]: hit ? timestamp : now,
      };

      return {
        Hit: hit,
        NextContext: nextContext,
        PickedKeys: Object.keys(nextContext),
      };
    },
    ContextValidationZod: z.record(z.string(), z.number()),
  };
});
