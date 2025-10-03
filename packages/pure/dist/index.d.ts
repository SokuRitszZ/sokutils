declare const iife: <T>(fn: () => T) => T;

declare function either<T, E = any>(fn: () => Promise<T>): Promise<[T, undefined] | [undefined, E]>;
declare function either<T, E = any>(fn: () => T): [T, undefined] | [undefined, E];

declare function unwrap<T>(fn: () => Promise<T>): Promise<T | undefined>;
declare function unwrap<T>(fn: () => T): T | undefined;

export { either, iife, unwrap };
