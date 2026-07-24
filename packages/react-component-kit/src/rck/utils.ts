import { twMerge } from 'tailwind-merge';
import { compact, isString } from 'es-toolkit';
import { get, isArray, isObject, keys } from 'es-toolkit/compat';
import { RCKConfig } from './types';

export const getFinalClassName = (rest: RCKConfig[], props: any, className?: string) => {
  const configured = twMerge(rest.map(config => {
    if (isString(config)) {
      return config;
    }
    return twMerge(
      keys(config).flatMap(configKey => {
        const result = (() => {
          const oneConfig = config[configKey];
          if (isObject(oneConfig) && !isArray(oneConfig)) {
            const propsValue = get(props, configKey);
            return get(
              oneConfig,
              isString(propsValue) && propsValue || '',
            );
          }
          if (isArray(oneConfig) && isArray(oneConfig[0]) && isArray(oneConfig[1])) {
            const isMatch = +!!get(props, configKey);
            return oneConfig[isMatch];
          }
          else {
            const isMatch = +!!get(props, configKey);
            return isMatch && oneConfig || [];
          }
        })();
        return compact([result]);
      }),
    );
  }));

  return twMerge(configured, className);
};
