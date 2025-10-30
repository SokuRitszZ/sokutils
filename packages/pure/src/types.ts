export type MaybePromise<T> = T | Promise<T>;

export type Fn<R = any> = (...args: any[]) => R;