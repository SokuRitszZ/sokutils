import { z } from 'zod/v4-mini';
import { CacheDefineStrategy } from '../../define';

export const CachePresetStrategyOnce = CacheDefineStrategy(() => {
  return {
    InitContext: () => ({}) as Record<string, boolean>,
    Match: (params) => {
      const hit = !!params.CurrentContext[params.Key];
      params.CurrentContext[params.Key] = true;
      return {
        Hit: !!params.CurrentContext[params.Key],
        NextContext: params.CurrentContext,
      };
    },
    ContextValidationZod: z.record(z.string(), z.boolean()),
  };
});
