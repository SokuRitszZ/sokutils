import { compact, get, isObject, isString, keys } from 'lodash-es';
import { FC, forwardRef, ForwardRefExoticComponent, HTMLAttributes, PropsWithChildren, RefAttributes, useMemo } from 'react';
import { twMerge } from 'tailwind-merge';

type RM = Record<string, string>;
type StateMap = Record<string, string | RM>;

type Resolved<M extends StateMap> = {
  [K in keyof M]?: M[K] extends string
    ? any
    : keyof M[K];
}

export const vars = <M extends Record<string, string>>(m: M, def?: keyof M): M => {
  return {
    ...m,
    _def: def,
  };
};

type ResolvedProps<T extends keyof HTMLElementTagNameMap, P, M extends StateMap> = 
  & HTMLAttributes<HTMLElementTagNameMap[T]>
  & P
  & Resolved<M>
  & {
    className?: string;
  };

export const w = 
<T extends keyof HTMLElementTagNameMap, P, M extends StateMap>(tag: T | FC<P>, map: M, ...statics: string[]):
  ForwardRefExoticComponent<RefAttributes<HTMLElementTagNameMap[T]> & ResolvedProps<T, P, M>> => {
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
      .map(k => map[k])
      .join(' ');
    
    const enumStr = keys(map)
      .filter(k => isObject(map[k]))
      .map(k => {
        // actual key
        const ak = prop[k] ?? get(map[k], '_def'); 
        return isString(ak) ? map[k][ak] : '';
      })
      .join(' ');

    const cn = twMerge(staticStr, enumStr, booleanStr, className);
    
    return <As ref={ref} className={cn} {...prop} />;
  });

  return comp as any;
};

export const clx = { w, vars };