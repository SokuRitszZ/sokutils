import { createLock } from '../runtime';
import { stackScheduler } from '../runtime/schedulers';
import type { StackLock } from './types';

export const stack = (): StackLock => createLock(1, stackScheduler<void>(), undefined);

export type { StackLock } from './types';
