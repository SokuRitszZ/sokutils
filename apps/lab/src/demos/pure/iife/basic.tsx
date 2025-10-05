import { iife } from '@sokutils/pure';

export const PureIIFEDemo = () => {
  const greeting = iife(() => {
    return 'Hello World';
  });

  return (
    <div>
      {greeting}
    </div>
  );
};