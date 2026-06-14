import { createLock } from '../runtime';
import { dequeScheduler } from '../runtime/schedulers';
import type { DequeLock } from './types';

export const deque = (): DequeLock => createLock(1, dequeScheduler(), 'back');

export type { DequeDirection, DequeLock } from './types';
