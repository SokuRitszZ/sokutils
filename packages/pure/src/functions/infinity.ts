interface InfinityOptions<P> {
  next: (p: P) => P;
  end: (p: P) => boolean;
}

export const infinity = <P>(options: InfinityOptions<P>) => {
  return <E, T>(init: (extra?: E) => Promise<P>, fn: (p: P, extra?: E) => Promise<T[]>) => {
    return async (extra?: E): Promise<T[]> => {
      const { next, end } = options;
      let p: P = await init(extra);
      const result: T[] = [];
      while (!end(p)) {
        const data: T[] = await fn(p, extra);
        result.push(...data);
        p = next(p);
      }
      return result;
    };
  };
};

type Page = [number, number, number];
infinity.preset = {
  normal: infinity({
    next: ([idx, size, total]: Page): Page => [idx + 1, size, total],
    end: ([idx, size, total]) => (idx - 1) * size >= total,
  }),
};