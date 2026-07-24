type MaybePromise<T> = T | Promise<T>;

export function unwrap<T, >(fn: () => Promise<T>): Promise<T | undefined>;
export function unwrap<T, >(fn: () => T): T | undefined;
export function unwrap<T, >(fn: () => T): MaybePromise<T | undefined> {
  try {
    return fn();
  }
  catch {
    return undefined;
  }
}
