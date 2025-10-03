import { MaybePromise } from '../types';

export function either<T, E = any>(fn: () => Promise<T>): Promise<[T, undefined] | [undefined, E]>;
export function either<T, E = any>(fn: () => T): [T, undefined] | [undefined, E];
export function either<T, E = any>(fn: () => T): MaybePromise<[T, undefined] | [undefined, E]> {
  try {
    const res = fn();
    if (res instanceof Promise) {
      return res.then((res) => [res, undefined]).catch((err) => [undefined, err]) as MaybePromise<[T, undefined] | [undefined, E]>;
    }
    return [res, undefined];
  }
  catch(err) {
    return [undefined, err];
  }
}
