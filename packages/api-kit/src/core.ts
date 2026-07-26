import { compact, toPairs } from 'es-toolkit/compat';
import { z } from 'zod/v4-mini';
import { ApiKitConfig, ApiKitConfigPerFetch, ApiKitConfigPerFetchResolver, ApiKitConfigResolver, TApiKit } from './types';

export const ApiKit = <ResponseType = any>(
  originConfig: ApiKitConfig<ResponseType> = {},
  configPerFetchResolver: ApiKitConfigPerFetchResolver = c => c,
): TApiKit<ResponseType> => {
  return {
    config: (configResolver) => ApiKit(configResolver(originConfig), configPerFetchResolver),
    configPerFetchResolver: (configResolver) => ApiKit(originConfig, configResolver),
    fetch: async () => {
      const config = configPerFetchResolver(originConfig);
      const finalUrl = compact([config?.BaseURL, config?.Path]).join('/');
      const withQueryUrl = compact([finalUrl, new URLSearchParams(toPairs(config?.Query)).toString()]).join('?');
      const headers = await config?.GetHeaders?.();

      config?.Debug?.(config, headers, withQueryUrl);

      return fetch(withQueryUrl, {
        method: config?.Method,
        body: config?.Body,
        headers,
      }).then(async r => {
        const handler = config.ResponseResolver || ((r) => r.json());
        const result = await handler(r);
        const zod = originConfig.ResponseZod || z.any();
        return zod.parse(result);
      }).then(r => {
        config.ResponseHandlers?.map(handler => handler(r));
        return r;
      }).catch(e => {
        config.ErrorHandlers?.map(handler => handler(e));
        throw e;
      });
    },
  };
};
