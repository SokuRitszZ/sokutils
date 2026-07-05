import { CacheDefineStrategy } from '../../define';

export const CachePresetStrategyLRU = CacheDefineStrategy((cap: number) => {
  return {
    InitContext: () => [] as string[],
    Match: (params) => {
      const nextKeys = params.CurrentContext.filter(x => x !== params.Key).concat(params.Key).slice(-cap);
      return {
        Hit: params.CurrentContext.includes(params.Key),
        NextContext: nextKeys,
        PickedKeys: nextKeys,
      };
    },
  };
});
