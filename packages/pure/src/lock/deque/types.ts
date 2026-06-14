import type { Unlock } from '../core/types';

export type DequeDirection = 'front' | 'back';
export type DequeLock = (direction?: DequeDirection) => Promise<Unlock>;
