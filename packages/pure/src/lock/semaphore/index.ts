import { core } from '../core';
import type { Semaphore } from './types';

export const semaphore = (capacity: number): Semaphore => core(capacity);

export type { Semaphore } from './types';
