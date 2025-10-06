import { ctx } from '@sokutils/react';

interface Model {
  count: number;
}

export const [model, useModel] = ctx.model<Model>({
  count: 0,
});
