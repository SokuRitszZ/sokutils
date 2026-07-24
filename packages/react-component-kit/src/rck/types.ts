import {
  ComponentProps,
  ComponentPropsWithoutRef,
  ComponentRef,
  ComponentType,
  FC,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';

export type HTMLTag = keyof HTMLElementTagNameMap;

export type Obj = Record<string, any>;

export type RCKConfig = string | RCKConfigStatusMap;
export type RCKConfigStatusMap = Record<string, RCKConfigStatusMapValue>;
export type RCKConfigStatusMapValue = string | string[] | [string[], string[]] | Record<string, string | string[]>

export type RCKHtml<Tag extends HTMLTag, ConfigRest extends RCKConfig[]> =
  ForwardRefExoticComponent<
    PropsWithoutRef<RCKHtmlProps<Tag, ConfigRest>>
    & RefAttributes<ComponentRef<Tag>>
  >;

export type RCKHtmlProps<Tag extends HTMLTag, ConfigRest extends RCKConfig[]> = Assign<
  RCKConfigRestConvert<ConfigRest>,
  ComponentPropsWithoutRef<Tag>
>

export type RCKComponent<Component extends FC<any>, ConfigRest extends RCKConfig[]> =
  FC<
    RCKComponentProps<Component, ConfigRest>
  >

export type RCKComponentProps<Component extends ComponentType<any>, ConfigRest extends RCKConfig[]> = Assign<
  RCKConfigRestConvert<ConfigRest>,
  ComponentProps<Component>
>

export type RCKConfigRestConvert<ConfigRest extends RCKConfig[], PropKeyMap extends Obj = {}> =
  ConfigRest extends [
    infer Config extends RCKConfig,
    ...infer OtherConfigs extends RCKConfig[],
  ]
    ? RCKConfigRestConvert<OtherConfigs, RCKConfigMerge<RCKConfigConvert<Config>, PropKeyMap>>
    : PropKeyMap;

export type RCKConfigConvert<Config extends RCKConfig> =
  Config extends string
    ? {}
    : {
        [K in keyof Config]?: Config[K] extends Record<string, string | string[]>
          ? keyof Config[K]
          : boolean
      }

export type RCKConfigMerge<Left extends Obj, Right extends Obj = {}> = {
  [K in (keyof Left | keyof Right)]?:
    (K extends keyof Left ? Left[K] : never)
    | (K extends keyof Right ? Right[K] : never)
}

export type Assign<A, B> = Omit<A, keyof B> & B;
