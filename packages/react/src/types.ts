import { Dispatch, SetStateAction } from 'react';

export type Anemic<M> = {
  [K in keyof SoftRequired<M>]: M[K];
} & {
  [K in keyof SoftRequired<M> as K extends string ? `set${Capitalize<K>}` : never]: Dispatch<SetStateAction<M[K]>>;
}

export type SoftRequired<M> = {
  [K in keyof Required<M>]: M[K];
}

export type Obj = Record<string, any>;
export type ParRec<T extends string, P> = Partial<Record<T, P>>;
export type ParDic<T> = ParRec<string, T>;
