import type { Unlock } from '../core/types';

export type Resolver = (unlock: Unlock) => void;

export interface Waiter<T> {
  input: T;
  order: number;
  resolve: Resolver;
}

export interface Scheduler<T> {
  enqueue: (waiter: Waiter<T>) => void;
  dequeue: () => Waiter<T> | undefined;
}
