import { assign, chain, keys } from 'lodash-es';
import { createContext, FC, useContext, useMemo } from 'react';

type ResolvedHooksMap<HM extends Record<string, () => any>> = {
  [K in keyof HM]: ReturnType<HM[K]>;
}

export const createHooksCtx = <HM extends Record<string, () => any>, >(map: HM) => {
  const Context = createContext<ResolvedHooksMap<HM>>({} as any); 

  const hoc = <P, R extends FC<P>, S>(RFC: R, s?: S) => {
    const ResolvedRFC = (props: P) => {
      const hookMap = keys(map)
        .map(k => ({ [k]: map[k]() }))
        .reduce((pre, cur) => ({ ...pre, ...cur }));

      return (
        <Context.Provider value={hookMap as ResolvedHooksMap<HM>}>
          <RFC {...props as any} />
        </Context.Provider>
      );
    };
    assign(ResolvedRFC, RFC, s);
    return ResolvedRFC as R & S;
  };

  const use = () => useContext(Context);
  
  return [hoc, use] as const;
};