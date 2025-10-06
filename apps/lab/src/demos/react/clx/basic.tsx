import { clx } from '@sokutils/react';

const UI = {
  Layout: clx.w(
    'div', 
    {}, 
    'flex flex-col items-stretch gap-2', 
    'w-200px max-h-400px',
  ),
  Item: clx.w(
    'div',
    {},
    'py-2 px-4 rounded-md',
    'bg-primary text-primary-foreground',
  ),
};

export default () => {
  return (
    <UI.Layout>
      <UI.Item>Item 1</UI.Item>
      <UI.Item>Item 2</UI.Item>
      <UI.Item>Item 3</UI.Item>
    </UI.Layout>
  );
};