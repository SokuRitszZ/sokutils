import { assign, keys, upperFirst } from 'es-toolkit/compat';
import { createContext, type FC, useContext, useState } from 'react';
import type { Anemic, SoftRequired } from './types';

export const createModelCtx = <M, >(initialModel: SoftRequired<M>) => {
  const Context = createContext<Anemic<M>>({} as Anemic<M>);

  const hoc = <P, R extends FC<P>, S>(RFC: R, statics?: S) => {
    const ResolvedRFC = (props: P) => {
      const anemicModel = keys(initialModel)
        .map(rawKey => {
          const key = rawKey as keyof M;
          const [value, setValue] = useState(initialModel[key]);

          return {
            [key]: value,
            [`set${upperFirst(key as string)}`]: setValue,
          };
        })
        .reduce((previous, current) => ({ ...previous, ...current }));

      return (
        <Context.Provider value={anemicModel as Anemic<M>}>
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
