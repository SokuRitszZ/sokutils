import { core, mutex, priority, semaphore, stack } from './core';

export const lock = {
  core,
  mutex,
  priority,
  semaphore,
  stack,
};

export * from './core';
