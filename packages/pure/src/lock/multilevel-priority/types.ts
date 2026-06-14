import type { Unlock } from '../core/types';

export type MultilevelPriorityLock = (priority?: number) => Promise<Unlock>;
