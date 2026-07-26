import { ZodMiniType } from 'zod/v4-mini';

export type MaybePromise<P> = P | Promise<P>

export interface ApiKitConfig {
  BaseURL?: string;
  Path?: string;
  Method?: string;
  Body?: string;
  Query?: Record<string, any>;
  GetHeaders?: () => MaybePromise<Record<string, any>>;
  ResponseResolver?: (response: Response) => any;
  ResponseZod?: ZodMiniType
  ResponseHandlers?: ApiKitResponseHandler[];
  ErrorHandlers?: ApiKitResponseHandler[];
}

export type ApiKitResponseHandler = (response: any) => void
