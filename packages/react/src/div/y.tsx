/* eslint-disable @typescript-eslint/ban-ts-comment */
import { AllHTMLAttributes, createElement, forwardRef } from 'react';
import { ConvertConfigToProps, HTMLTag, StandardDivConfig } from './types';
import { mergeClassName } from './utils';

export const divy = <T extends HTMLTag, C extends StandardDivConfig>(
  tag: T,
  config: C,
  ...restClassNames: string[]
) => {
  type HTMLTagType = HTMLElementTagNameMap[T];
  type HTMLTagAttr = AllHTMLAttributes<HTMLTagType>;
  type CoveredProps = Omit<ConvertConfigToProps<C>, keyof HTMLTagAttr | 'className'>;
  type Props = CoveredProps & HTMLTagAttr & { className?: string };

  const Tag = tag;
  // @ts-expect-error 
  const PureComponent = forwardRef<HTMLTagType, Props>(({ className: propClassName, ...props }, ref) => {
    // @ts-expect-error
    const resolvedClassNames = mergeClassName({ config, restClassNames, propClassName, props });

    // @ts-expect-error
    return <Tag ref={ref} className={resolvedClassNames} {...props} />;
  });

  return PureComponent;
};
