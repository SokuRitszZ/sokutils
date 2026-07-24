import { assign } from 'es-toolkit/compat';
import { createContext, type FC, useContext } from 'react';

export const createPropsCtx = <P, >() => {
  const Context = createContext<P>({} as P);

  const hoc = <R extends FC<any>, S>(RFC: R, statics?: S): FC<P> & S => {
    const ResolvedRFC = (props: P) => {
      const Component = RFC as FC;

      return (
        <Context.Provider value={props}>
          <Component />
        </Context.Provider>
      );
    };

    assign(ResolvedRFC, RFC, statics);
    return ResolvedRFC as R & S;
  };

  const use = () => useContext(Context);

  return [hoc, use] as const;
};
