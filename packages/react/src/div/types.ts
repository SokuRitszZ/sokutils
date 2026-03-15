export type HTMLTag = keyof HTMLElementTagNameMap;

export type StandardDivConfig = {
  [K in string]: [string, string] | Record<string, string> | string;
}

export type ConvertConfigToProps<C extends StandardDivConfig> = {
  [K in keyof C]?: C[K] extends Record<string, string>
    ? keyof C[K] : any;
}