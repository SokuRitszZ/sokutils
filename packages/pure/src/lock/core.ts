import { createLock } from './runtime';
import {
  dequeScheduler,
  fifoScheduler,
  multilevelPriorityScheduler,
  priorityScheduler,
  stackScheduler,
} from './schedulers';
import type {
  DequeLock,
  Lock,
  MultilevelPriorityLock,
  Mutex,
  PriorityLock,
  Semaphore,
  StackLock,
} from './types';

export const core = (capacity = 1): Lock => createLock(capacity, fifoScheduler<void>(), undefined);

export const mutex = (): Mutex => core();

export const semaphore = (capacity: number): Semaphore => core(capacity);

export const priority = (): PriorityLock => createLock(1, priorityScheduler(), 0);

export const stack = (): StackLock => createLock(1, stackScheduler<void>(), undefined);

export const multilevelPriority = (): MultilevelPriorityLock => createLock(1, multilevelPriorityScheduler(), 0);

export const deque = (): DequeLock => createLock(1, dequeScheduler(), 'back');

export type {
  DequeDirection,
  DequeLock,
  Lock,
  MultilevelPriorityLock,
  Mutex,
  PriorityLock,
  Release,
  Semaphore,
  StackLock,
  Unlock,
} from './types';
