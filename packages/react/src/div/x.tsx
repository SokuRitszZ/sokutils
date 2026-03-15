import { StandardDivConfig } from './types';
import { divy } from './y';


export const divx = <C extends StandardDivConfig>(
  config: C,
  ...restClassNames: string[]
) => divy<'div', C>('div', config, ...restClassNames);
