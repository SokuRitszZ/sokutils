import { assign, keys, upperFirst } from 'es-toolkit/compat';
import { createContext, type FC, useContext, useState, useEffect } from 'react';
import { pickBy } from 'es-toolkit';
import type { Anemic, CreateModelCtxSync, SoftRequired } from './types';

export const createModelCtx = <M, >(propsInitialModel: SoftRequired<M>, sync?: CreateModelCtxSync<SoftRequired<M>>) => {
  const Context = createContext<Anemic<M>>({} as Anemic<M>);

  const hoc = <P, R extends FC<P>, S>(RFC: R, statics?: S) => {
    const initialModel = sync?.Zod.safeParse(sync.State.Load()).data || propsInitialModel;
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

      const stateValue = pickBy(anemicModel, (_, k) => !`${k}`.startsWith('set'));
      useEffect(() => {
        sync?.State.Save(sync.Zod.safeParse(stateValue).data);
      }, [stateValue]);
      useEffect(() => {
        return () => {
          sync?.State.Dispose();
        };
      }, []);

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
