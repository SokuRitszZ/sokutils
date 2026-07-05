export type MaybePromise<T> = T | Promise<T>;

export type NormalFunction<P extends any[] = any[], R = any> = (...args: P) => R;
