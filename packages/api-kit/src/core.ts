import { compact, merge, toPairs } from 'es-toolkit/compat';
import { ApiKitConfig } from './types';

export const ApiKit = (originConfig?: ApiKitConfig) => {

  return {
    config: (configResolver: (config?: ApiKitConfig) => ApiKitConfig) => {
      return ApiKit(configResolver(originConfig));
    },
    fetch: async () => {
      const finalUrl = compact([originConfig?.BaseURL, originConfig?.Path]).join('/');
      const withQueryUrl = compact([finalUrl, new URLSearchParams(toPairs(originConfig?.Query)).toString()]).join('?');
      const headers = await originConfig?.GetHeaders?.();

      console.log(headers, withQueryUrl);

      return fetch(withQueryUrl, {
        method: originConfig?.Method,
        body: originConfig?.Body,
        headers,
      }).then(r => {
        const handler = originConfig?.ResponseResolver || ((r) => r.json());
        return handler(r);
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
