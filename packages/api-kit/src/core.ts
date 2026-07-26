import { cloneDeep, compact, merge, toPairs } from 'es-toolkit/compat';
import { z } from 'zod/v4-mini';
import { ApiKitConfig, TApiKit } from './types';

export const ApiKit = <ResponseType = any>(originConfig: ApiKitConfig<ResponseType> = {}): TApiKit<ResponseType> => {
  return {
    config: (configResolver) => {
      return ApiKit(configResolver(originConfig));
    },
    fetch: async () => {
      const finalUrl = compact([originConfig?.BaseURL, originConfig?.Path]).join('/');
      const withQueryUrl = compact([finalUrl, new URLSearchParams(toPairs(originConfig?.Query)).toString()]).join('?');
      const headers = await originConfig?.GetHeaders?.();

      originConfig?.Debug?.(headers, withQueryUrl);

      return fetch(withQueryUrl, {
        method: originConfig?.Method,
        body: originConfig?.Body,
        headers,
      }).then(async r => {
        const handler = originConfig?.ResponseResolver || ((r) => r.json());
        const result = await handler(r);
        const zod = originConfig.ResponseZod || z.any();
        return zod.parse(result);
      }).then(r => {
        originConfig?.ResponseHandlers?.map(handler => handler(r));
        return r;
      }).catch(e => {
        originConfig?.ErrorHandlers?.map(handler => handler(e));
        throw e;
      });
    },
  };
};
