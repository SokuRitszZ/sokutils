/* eslint-disable @typescript-eslint/ban-ts-comment */
import { forwardRef } from 'react';
import { HTMLTag, RCKConfig, RCKHtml, RCKHtmlProps } from './types';
import { getFinalClassName } from './utils';

const rckCore = <Tag extends HTMLTag, ConfigRest extends RCKConfig[]>(Tag: Tag, ...rest: ConfigRest): RCKHtml<Tag, ConfigRest> => {
  // @ts-ignore
  return forwardRef<HTMLElementTagNameMap[Tag], RCKHtmlProps<Tag, ConfigRest>>((props, ref) => {
    // @ts-ignore
    const finalClassName = getFinalClassName(rest, props, props.className);
    // @ts-ignore
    return <Tag {...props} className={finalClassName} ref={ref} />;
  });
};

export type RckTagMethod = typeof rckCore & {
  [K in HTMLTag]: <ConfigRest extends RCKConfig[]>(...rest: ConfigRest) => RCKHtml<K, ConfigRest>;
}

export const rck = new Proxy(rckCore, {
  get: (_, key: HTMLTag) => {
    return (...configs: RCKConfig[]) => rckCore(key, ...configs);
  },
}) as RckTagMethod;
