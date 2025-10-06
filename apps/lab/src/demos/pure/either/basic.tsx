import { either } from '@sokutils/pure';

const normal = either(() => {
  return JSON.parse('{}');
});

console.log('[either]normal', normal);

const normalError = either(() => {
  return JSON.parse('[ak');
});

console.log('[either]normal error', normalError);

const promised = either(() => {
  return new Promise((resolve, reject) => { 
    reject('error');
  });
});

promised.then(r => {
  console.log('[either]promised', r);
});

export default () => undefined;