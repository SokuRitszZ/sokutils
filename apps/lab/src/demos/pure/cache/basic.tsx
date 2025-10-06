import { cache } from '@sokutils/pure';

const rand = (_: any) => Math.random();
const cached = cache.core(rand);

console.log('[cache.core]default strategy', cached(1), cached(1), cached(1) === cached(1));
console.log('[cache.core]other params', cached(1), cached(2), cached(1) !== cached(2));

export default () => undefined;