/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ComponentProps, ComponentRef, ComponentType, forwardRef } from 'react';
import { ConvertConfigToProps, StandardDivConfig } from './types';
import { mergeClassName } from './utils';

export const divz = <
  TComponent extends ComponentType<any>,
  C extends StandardDivConfig
>(Component: TComponent, config: C, ...restClassNames: string[]) => {
    type OriginProps = ComponentProps<TComponent>;
    type RefType = ComponentRef<TComponent>;
    type AdditionalProps = ConvertConfigToProps<C>;
    type Props = OriginProps & Omit<AdditionalProps, keyof OriginProps> & { className?: string };
    
    const FinalComponent = forwardRef<RefType, Props>(({ className: propClassName, ...props }, ref) => {
      const { className, ...restProps } = props;
      const finalClassName = mergeClassName({
        props: props,
        propClassName,
        config,
        restClassNames,
      });
      return (
        // @ts-expect-error
        <Component ref={ref} {...restProps} className={finalClassName} />
      );
    });

    return FinalComponent;
};
