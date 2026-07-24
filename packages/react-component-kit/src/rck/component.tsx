/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ComponentType, forwardRef, ComponentRef } from 'react';
import { get, isString } from 'es-toolkit/compat';
import { RCKComponentProps, RCKConfig } from './types';
import { getFinalClassName } from './utils';

export const Rck = <
  TComponent extends ComponentType<any>,
  ConfigRest extends RCKConfig[],
>(Component: TComponent, ...rest: ConfigRest) => {
  return forwardRef<ComponentRef<TComponent>, RCKComponentProps<TComponent, ConfigRest>>((props, ref) => {
    const originalClassName = get(props, 'className');
    const finalClassName = getFinalClassName(rest, props, isString(originalClassName) && originalClassName || '');

    // @ts-ignore
    return <Component {...props} className={finalClassName} ref={ref} />;
  });
};
