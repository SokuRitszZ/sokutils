import { iife } from '@sokutils/pure';

export default () => {
  const greeting = iife(() => {
    return 'Hello World';
  });

  return (
    <div>
      {greeting}
    </div>
  );
};