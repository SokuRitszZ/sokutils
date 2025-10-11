type literal = string | number;
type Obj = Record<literal, any>;

type LiteralKeyOf<T extends Obj> = {
  [K in keyof T]: K extends literal ? K : never;
}[keyof T];

type Path<M extends Obj, P extends literal[], S extends string, E extends string> = {
  [K in LiteralKeyOf<Required<M>>]: Path<Required<M>[K], [...P, K], S, E>;
} & {
  [K in E]: Join<P, S>;
} & {
  [K in string]: Path<Required<M>[K], [...P, K], S, E>;
}

type ConfirmLiteralArr<A> = A extends literal[] ? A : never;
type ConfirmLiteral<L> = L extends literal ? L : never; 

type Join<P extends literal[], S extends string> = P extends literal[]
  ? P extends [infer L, ...infer R]
    ? `${ConfirmLiteral<L>}${R extends [] ? '' : S}${Join<ConfirmLiteralArr<R>, S>}`
    : ''
  : ''

export const createPathHelper = <S extends string, E extends string>(s: S, e: E) => {
  return {
    typing: <M extends Obj>(prefix: literal[] = []): Path<M, [], S, E> => {
      const proxy = new Proxy({}, {
        get: (_, key) => {
          if (key === e) {
            return prefix.join(s);
          }
          return createPathHelper(s, e).typing([...prefix, key as literal]);
        }
      })

      return proxy as Path<M, [], S, E>;
    }
  }
};

type PathSdk<E extends string> = ({
  [K in E]: (...param: any[]) => any;
} | {}) & ({
  [K in string]: PathSdk<E> | ((...param: any[]) => any)
} | {}) | {};

export type PathSdkMap<E extends string, T extends PathSdk<E>> = T;

type M = PathSdkMap<'req', {
  req: () => number;
  album: {
    get: {
      req: (foo: string, bar: number) => string;
    };
    post: {
      req: (id: string) => {};
    }
  }
}>;

interface DefineOption {
  prefix: literal[];
}

export const createPathSdk = <E extends string>(e: E) => {
  return {
    define: <M extends PathSdk<E>>(fn: (opt: DefineOption) => (...params: any[]) => any, prefix: literal[] = []) => {
      const proxy = new Proxy({}, {
        get: (_, key) => {
          if (key === e) {
            return fn({ prefix });
          }
          return createPathSdk(e).define(fn, [...prefix, key as literal]);
        }
      }) 

      return proxy as M;
    }
  } 
}

export const path = {
  str: {
    core: createPathHelper,
    preset: {
      dot: createPathHelper('.', '$'),
      snake: createPathHelper('_', 'z'),
      slash: createPathHelper('/', 'p'),
    }
  },
  sdk: {
    core: createPathSdk,
    preset: {
      
    }
  }
}