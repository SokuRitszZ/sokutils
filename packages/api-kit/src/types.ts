import { ZodMiniType } from 'zod/v4-mini';

export type MaybePromise<P> = P | Promise<P>

export interface TApiKit<ResponseType> {
  config: <NextResponseType>(resolver: ApiKitConfigResolver<ResponseType, NextResponseType>) => TApiKit<NextResponseType>;
  fetch: () => Promise<ResponseType>
}

export type ApiKitConfigResolver<ResponseType, NextResponseType> = (config: ApiKitConfig<ResponseType>) => ApiKitConfig<NextResponseType>

export interface ApiKitConfig<ResponseType = any> {
  BaseURL?: string;
  Path?: string;
  Method?: string;
  Body?: string;
  Query?: Record<string, any>;
  GetHeaders?: () => MaybePromise<Record<string, any>>;
  ResponseResolver?: (response: Response) => any;
  ResponseZod?: ZodMiniType<ResponseType>;
  ResponseHandlers?: ApiKitResponseHandler<ResponseType>[];
  ErrorHandlers?: ApiKitErrorHandler[];

  Debug?: (...messages: any[]) => void;
}

export type ApiKitResponseHandler<ResponseType> = (response: ResponseType) => void
export type ApiKitErrorHandler = (error: Error) => void
