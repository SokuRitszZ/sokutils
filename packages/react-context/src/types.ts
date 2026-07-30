import type { Dispatch, SetStateAction } from 'react';
import { ZodMiniType } from 'zod/v4-mini';

export type Anemic<M> = {
  [K in keyof SoftRequired<M>]: M[K];
} & {
  [K in keyof SoftRequired<M> as K extends string ? `set${Capitalize<K>}` : never]: Dispatch<SetStateAction<M[K]>>;
};

export type SoftRequired<M> = {
  [K in keyof Required<M>]: M[K];
};

export interface CreateModelCtxSync<M> {
  State: CreateModelCtxSyncState;
  Zod: ZodMiniType<M>;
}

export interface CreateModelCtxSyncState{
  Load: () => any | undefined;
  Save: (value?: any) => void;
}
