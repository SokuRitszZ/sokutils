import { rck } from '@sokutils/react-component-kit';
import { useState } from 'react';

const UI = {
  Layout: rck.div(
    'flex flex-col gap-2 items-stretch',
    'w-200px',
  ),
  UserCard: rck.div(
    'py-2 px-4',
    'border-border rounded-md',
    'bg-primary-foreground text-primary',
    'cursor-pointer',
    'flex items-center gap-2',
    'duration-100',
    { selected: 'bg-primary text-primary-foreground' },
  ),
  Dot: rck.div(
    'size-2',
    'border-1 border-gray bg-gray',
    'rounded-full',
    { online: 'bg-green border-green' },
  ),
};

export default () => {
  const [user, setUser] = useState('');

  return (
    <UI.Layout>
      {['Alice', 'Bob'].map((name, i) =>
        <UI.UserCard selected={user === name} onClick={() => setUser(name)}>
          {name}
          <UI.Dot online={!!i} />
        </UI.UserCard>,
      )}
    </UI.Layout>
  );
};
