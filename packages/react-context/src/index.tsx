import { createHooksCtx } from './hooks';
import { createModelCtx } from './model';
import { createPropsCtx } from './props';

export * from './hooks';
export * from './model';
export * from './props';
export type * from './types';

export const ctx = {
  props: createPropsCtx,
  model: createModelCtx,
  hooks: createHooksCtx,
};
