import { isString, upperFirst } from 'lodash-es';
import { unwrap } from '../functions';

export const hash = {
  _: (x: any) => {
    const str = isString(x)
      ? x
      : unwrap(() => JSON.stringify(x)) ?? '';
    return str.split('');
  },
  number: (x: any, limit = 65535) => {
    return hash._(x).reduce((acc, cur) => {
      return (acc + cur.charCodeAt(0)) % limit + 1;
    }, 0);
  },
  boolean: (x: any) => {
    return !!hash.number(x, 2);
  },
  string: (x: any, length = 6) => {
    const str = hash._(x).slice(0, length);
    return upperFirst(str.join(''));
  },
};