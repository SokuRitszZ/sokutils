import { z } from 'zod/v4-mini';
import { CacheDefineStrategy } from '../../define';

export const CachePresetStrategyExpireAt = CacheDefineStrategy((expireAt: number) => {
  return {
    InitContext: () => ({}) as Record<string, boolean>,
    Match: (params) => {
      if (Date.now() > expireAt) {
        return {
          Hit: false,
          NextContext: {},
          PickedKeys: [],
        };
      }

      return {
        Hit: !!params.CurrentContext[params.Key],
        NextContext: {
          ...params.CurrentContext,
          [params.Key]: true,
        },
      };
    },
    ContextValidationZod: z.record(z.string(), z.boolean()),
  };
});
