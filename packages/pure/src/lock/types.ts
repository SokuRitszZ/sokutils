export type Unlock = () => void;
export type Release = Unlock;
export type Lock = () => Promise<Unlock>;
export type Mutex = Lock;
export type Semaphore = Lock;
export type PriorityLock = (priority?: number) => Promise<Unlock>;
export type StackLock = Lock;
export type MultilevelPriorityLock = (priority?: number) => Promise<Unlock>;
export type DequeDirection = 'front' | 'back';
export type DequeLock = (direction?: DequeDirection) => Promise<Unlock>;

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
