import { createLock } from '../runtime';
import { fifoScheduler } from '../runtime/schedulers';
import type { Lock } from './types';

export const core = (capacity = 1): Lock => createLock(capacity, fifoScheduler<void>(), undefined);

export type { Lock, Release, Unlock } from './types';
