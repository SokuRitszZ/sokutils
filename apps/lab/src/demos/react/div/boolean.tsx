import { divx } from '@sokutils/react';
import { useState } from 'react';

const UI = {
  Layout: divx(
    {},
    'flex flex-col gap-2 items-stretch',
    'w-200px',
  ),
  UserCard: divx(
    { selected: 'bg-primary text-primary-foreground' },
    'py-2 px-4',
    'border-border rounded-md',
    'bg-primary-foreground text-primary',
    'cursor-pointer',
    'flex items-center gap-2',
    'duration-100',
  ),
  Dot: divx(
    { online: 'bg-green border-green' },
    'size-2',
    'border-1 border-gray bg-gray',
    'rounded-full', 
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