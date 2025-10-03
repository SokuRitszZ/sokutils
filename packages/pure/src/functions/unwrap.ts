import { MaybePromise } from '../types';

export function unwrap<T, >(fn: () => Promise<T>): Promise<T | undefined>;
export function unwrap<T, >(fn: () => T): T | undefined;
export function unwrap<T, >(fn: () => T): MaybePromise<T | undefined> {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.catch(() => undefined);
    }
    return res; 
  }
  catch {
    return undefined;
  }
}

