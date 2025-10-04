
import { createContext, FC, useContext, useMemo, useState } from 'react';
import { assign, keys, upperFirst } from 'lodash-es';
import { Anemic } from '../types';

export const createModelCtx = <M, >(initialModel: Required<M>) => {
  const Context = createContext<Anemic<M>>({} as any);

  const hoc = <P, R extends FC<P>, S>(RFC: R, s?: S) => {
    const ResolvedRFC = (props: P) => {
      const anemicModel = keys(initialModel)
        .map(_k => {
          const k = _k as keyof M;
          const [value, set] = useState(initialModel[k]);
          return { [k]: value, [`set${upperFirst(k as string)}`]: set };
        })
        .reduce((pre, cur) => ({ ...pre, ...cur }));

      return (
        <Context.Provider value={anemicModel as Anemic<M>}>
          <RFC {...(props as any)} />
        </Context.Provider>
      );

    };
    assign(ResolvedRFC, RFC, s);
    return ResolvedRFC as R & S;
  };
  const use = () => useContext(Context);

  return [hoc, use] as const;
};
