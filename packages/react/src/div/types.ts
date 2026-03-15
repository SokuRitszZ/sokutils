export type HTMLTag = keyof HTMLElementTagNameMap;

export type StandardDivConfig = {
  [K in string]: [string, string] | StandardDivConigVariant | string;
};

export type StandardDivConigVariant = Record<string, string> & { __default?: string }

export type ConvertConfigToProps<C extends StandardDivConfig> = {
  [K in keyof C]?: C[K] extends Record<string, string>
    ? Exclude<keyof C[K], '__default'> : any;
}