export type Unlock = () => void;
export type Release = Unlock;
export type Lock = () => Promise<Unlock>;
export type Resolver = (unlock: Unlock) => void;

export interface LockStrategy<Context, Input extends any[]> {
  enqueue: (ctx: Context, input: Input) => Context;
  dequeue: (ctx: Context) => [Context, Input];
  unlock: (ctx: Context, input: Input) => Context;
  blocked: (ctx: Context) => boolean;
  initContext: () => Context;
}

export interface Waiter<Input> {
  input: Input;
  order: number;
  resolve: Resolver;
}

export interface Scheduler<Input> {
  enqueue: (waiter: Waiter<Input>) => void;
  dequeue: () => Waiter<Input> | undefined;
}
