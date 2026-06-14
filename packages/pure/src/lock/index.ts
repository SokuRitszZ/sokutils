import { core } from './core';
import { deque } from './deque';
import { multilevelPriority } from './multilevel-priority';
import { mutex } from './mutex';
import { priority } from './priority';
import { semaphore } from './semaphore';
import { stack } from './stack';

export const lock = {
  core,
  deque,
  multilevelPriority,
  mutex,
  priority,
  semaphore,
  stack,
};

export * from './core';
export * from './deque';
export * from './multilevel-priority';
export * from './mutex';
export * from './priority';
export * from './semaphore';
export * from './stack';
export * from './types';
