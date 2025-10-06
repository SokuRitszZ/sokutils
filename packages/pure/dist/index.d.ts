declare const iife: <T>(fn: () => T) => T;

declare function either<T, E = any>(fn: () => Promise<T>): Promise<[T, undefined] | [undefined, E]>;
declare function either<T, E = any>(fn: () => T): [T, undefined] | [undefined, E];

declare function unwrap<T>(fn: () => Promise<T>): Promise<T | undefined>;
declare function unwrap<T>(fn: () => T): T | undefined;

type FnType = (...args: any[]) => any;
interface CacheSettings<Fn extends FnType> {
    key: (params: Parameters<Fn>) => string;
    strategy: CacheStrategy;
}
type CacheStrategy = (key: string, ctx: any | undefined) => CacheStrategyResult;
interface CacheStrategyResult {
    hit: boolean;
    ctx: any;
}
type FnSettings<Fn extends FnType> = {
    [K in keyof CacheSettings<Fn>]: (setting: CacheSettings<Fn>[K]) => CachedFn<Fn>;
};
type CachedFn<Fn extends FnType> = Fn & FnSettings<Fn>;

declare const cache: {
    core: <Fn extends FnType>(fn: Fn) => CachedFn<Fn>;
    preset: {
        strategy: {
            expired: (time: number) => CacheStrategy;
            duration: (dur: number) => CacheStrategy;
            lru: (cap: number) => CacheStrategy;
        };
    };
};

export { cache, either, iife, unwrap };
