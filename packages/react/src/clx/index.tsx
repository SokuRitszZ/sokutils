import { compact, isObject, isString, keys } from 'lodash-es';
import { FC, forwardRef, HTMLAttributes, PropsWithChildren, useMemo } from 'react';

type RM = Record<string, string>;
type StateMap = Record<string, string | RM>;

type Resolved<M extends StateMap> = {
  [K in keyof M]?: M[K] extends string
    ? any
    : keyof M[K];
}


export const w = <T extends keyof HTMLElementTagNameMap, P, M extends StateMap>(tag: T | FC<P>, map: M, ...statics: string[]) => {
  type RM = Resolved<M>;
  type El = HTMLElementTagNameMap[T];
  type FinalP = typeof tag extends T
    ? HTMLAttributes<El>
    : P;
  type Prop = RM & FinalP & {
    className?: string;
  };

  const As = tag as any;

  const comp = forwardRef<any, PropsWithChildren<Prop>>(({ className, ...prop }: any, ref) => {
    const staticStr = useMemo(() => {
      return statics.join(' ');
    }, []);

    const booleanStr = keys(map)
      .filter((k) => isString(map[k]))
      .filter(k => prop[k])
      .join(' ');
    
    const enumStr = keys(map)
      .filter(k => isObject(map[k]))
      .map(k => isString(prop[k]) ? map[k][prop[k]] : '')
      .join(' ');

    const cn = compact([staticStr, booleanStr, enumStr, className]).join(' ');
    
    return <As ref={ref} className={cn} {...prop} />;
  });

  return comp;
};
