import { Dispatch, SetStateAction } from 'react';

export type Anemic<M> = {
  [K in keyof M]: M[K];
} & {
  [K in keyof M as K extends string ? `set${Capitalize<K>}` : never]: Dispatch<SetStateAction<M[K]>>;
}

export type SoftRequired<M> = {
  [K in keyof Required<M>]: M[K];
}