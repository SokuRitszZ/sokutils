import { assign } from 'lodash-es';
import { createContext, FC, useContext } from 'react';

export const createPropsCtx = <P, >() => {
  const Context = createContext<P>({} as any);

  const hoc = <R extends FC<any>, S, >(RFC: R, s?: S): FC<P> & S => {
    const ResolvedRFC = (props: P) => {
      const _R = RFC as FC<any>;

      return (
        <Context.Provider value={props}>
          <_R />
        </Context.Provider>
      );
    };
    assign(ResolvedRFC, RFC, s);
    return ResolvedRFC as R & S;
  };

  const use = () => useContext(Context);

  return [hoc, use] as const;
};