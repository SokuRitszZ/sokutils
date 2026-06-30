import { FC, PropsWithChildren } from 'react';
import { divx } from '../div';

type SplitSymbol = ' ' | '\n' | '\t' | '-' | '+';

type Split<S extends string, P extends string> = S extends `${infer L}${infer R}`
  ? L extends SplitSymbol
  ? Split<R, ''> | P
  : Split<R, `${P}${L}`>
  : P

type CamelCase<S extends string, Flag extends boolean = false> =
  S extends `${infer L}${infer R}`
  ? L extends '-'
  ? CamelCase<R, true>
  : Flag extends true
    ? `${Uppercase<L>}${CamelCase<R, false>}`
    : `${L}${CamelCase<R, false>}`
  : S

type KebabCaseToCamelCase<S extends string> = Capitalize<CamelCase<S>>;

export type LayoutFormat<S extends string> = Exclude<Split<S, ''>, ''>;
type ComponentProps = PropsWithChildren<{ className?: string }>;
export type Layout<S extends string> = ReturnType<typeof divx> & Record<KebabCaseToCamelCase<LayoutFormat<S>>, FC<ComponentProps>>;
