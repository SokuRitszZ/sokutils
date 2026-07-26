import { ApiKitConfigResolver } from './types';

export const ApiKitDefineConfigResolver = <ResponseType, NextResponseType>(resolver: ApiKitConfigResolver<ResponseType, NextResponseType>) => {
  return resolver;
};
