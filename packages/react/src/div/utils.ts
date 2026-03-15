import { twMerge } from 'tailwind-merge';
import { Obj } from '../types';
import { StandardDivConfig } from './types';

interface Props {
  config: StandardDivConfig;
  props: Obj;
  restClassNames: string[];
  propClassName?: string;
}

export const mergeClassName = ({
  config,
  restClassNames,
  propClassName,
  props,
}: Props) => {
  /**
   * merge classname 
   * the priorities are:
   * 1. propClassName
   * 2. config
   * 3. restClassNames
   */
  const effectiveConfigClassName = Object.keys(config)
    .map(key => {
      const theConfig = config[key];
      if (Array.isArray(theConfig)) {
        const idx = +!props[key];
        return config[key][idx];
      }
      if (typeof theConfig === 'string') {
        return !!props[key] && theConfig;
      }
      if (typeof theConfig === 'object') {
        const resolvedTheConfig = { ...theConfig };
        const choice = props[key] || resolvedTheConfig.__default;
        if (typeof choice === 'string') {
          return resolvedTheConfig[choice];
        }
      }
    });
  
  const result = twMerge(restClassNames, propClassName, effectiveConfigClassName);

  return result;
};

export const divVariants = <T extends Obj>(obj: T, __default: keyof T): T => {
  return {
    __default,
    ...obj,
  };
};
