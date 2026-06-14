import type { Unlock } from '../core/types';

export type PriorityLock = (priority?: number) => Promise<Unlock>;
