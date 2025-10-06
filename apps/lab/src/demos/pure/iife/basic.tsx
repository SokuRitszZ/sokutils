import { iife } from '@sokutils/pure';

iife(() => {
  console.log('Hello World!');
});

const greeting = iife(() => {
  // blabla ....
  return 'Hello World!';
});

console.log(greeting);

export default () => undefined;