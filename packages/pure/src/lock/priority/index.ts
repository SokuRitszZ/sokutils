import { createLock } from '../runtime';
import { priorityScheduler } from '../runtime/schedulers';
import type { PriorityLock } from './types';

export const priority = (): PriorityLock => createLock(1, priorityScheduler(), 0);

export type { PriorityLock } from './types';
