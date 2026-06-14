import { core } from '../core';
import type { Mutex } from './types';

export const mutex = (): Mutex => core();

export type { Mutex } from './types';
