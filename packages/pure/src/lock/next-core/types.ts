export interface LockStrategy<Context, Input extends any[]> {
  enqueue: (ctx: Context, input: Input) => Context;
  dequeue: (ctx: Context) => [Context, Input];
  unlock: (ctx: Context, input: Input) => Context;
  blocked: (ctx: Context) => boolean;
  initContext: () => Context;
}
