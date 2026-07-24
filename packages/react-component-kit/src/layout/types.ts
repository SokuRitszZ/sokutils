import { rck } from '../rck/tag';


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
type LayoutComponent = ReturnType<typeof rck.div>;
export type Layout<S extends string> = LayoutComponent & Record<KebabCaseToCamelCase<LayoutFormat<S>>, LayoutComponent>;

type Example = `
header  -       -
sidebar content -
+       +       -
footer  -       corner
`
type Test = KebabCaseToCamelCase<LayoutFormat<Example>>
type Final = Layout<Example>
