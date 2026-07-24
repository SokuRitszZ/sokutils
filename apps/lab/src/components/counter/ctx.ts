import { ctx } from '@sokutils/react-context';

interface Model {
  count: number;
}

export const [model, useModel] = ctx.model<Model>({
  count: 0,
});
