import { assign, keys } from 'es-toolkit/compat';
import { createContext, type FC, useContext } from 'react';

type ResolvedHooksMap<HooksMap extends Record<string, () => any>> = {
  [K in keyof HooksMap]: ReturnType<HooksMap[K]>;
};

export const createHooksCtx = <HooksMap extends Record<string, () => any>>(map: HooksMap) => {
  const Context = createContext<ResolvedHooksMap<HooksMap>>({} as ResolvedHooksMap<HooksMap>);

  const hoc = <P, R extends FC<P>, S>(RFC: R, statics?: S) => {
    const ResolvedRFC = (props: P) => {
      const hookMap = keys(map)
        .map(key => ({ [key]: map[key]() }))
        .reduce((previous, current) => ({ ...previous, ...current }));

      return (
        <Context.Provider value={hookMap as ResolvedHooksMap<HooksMap>}>
          <RFC {...props as any} />
        </Context.Provider>
      );
    };

    assign(ResolvedRFC, RFC, statics);
    return ResolvedRFC as R & S;
  };

  const use = () => useContext(Context);

  return [hoc, use] as const;
};
