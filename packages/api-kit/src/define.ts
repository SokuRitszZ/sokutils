import { ApiKitConfigPerFetchResolver, ApiKitConfigResolver } from './types';

export const ApiKitDefineConfigResolver = <ResponseType, NextResponseType>(resolver: ApiKitConfigResolver<ResponseType, NextResponseType>) => {
  return resolver;
};

export const ApiKitDefineConfigPerFetchResolver = (resolver: ApiKitConfigPerFetchResolver) => resolver;
