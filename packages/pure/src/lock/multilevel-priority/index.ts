import { createLock } from '../runtime';
import { multilevelPriorityScheduler } from '../runtime/schedulers';
import type { MultilevelPriorityLock } from './types';

export const multilevelPriority = (): MultilevelPriorityLock => {
  return createLock(1, multilevelPriorityScheduler(), 0);
};

export type { MultilevelPriorityLock } from './types';
