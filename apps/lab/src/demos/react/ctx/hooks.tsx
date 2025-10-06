import { ctx } from '@sokutils/react';
import { times } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { faker } from '@faker-js/faker';
import { Button, toast } from '@sokutils/shadcn-ui';

interface User {
  id: string;
  name: string;
}

const useScroll = () => {
  const container = useRef<HTMLDivElement>(null);
  const items = useRef<Partial<Record<string, HTMLElement>>>({});

  return {
    ref: {
      container,
      items,
    },
  };
};

const useUser = () => {
  const [user, setUser] = useState<User>();
  
  useEffect(() => {
    if (!user) return ;

    toast(`You have selected user: ${user.name}`, {
      description: user.id,
    });
  }, [user]);

  return {
    user,
    setUser,
  };
};

const [hoc, useHooks] = ctx.hooks({
  scroll: useScroll,
  user: useUser,
});

const data = times(1000, (): User => {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
  };
});

const ScrollApp = hoc(() => {
  const { scroll, user } = useHooks();
  
  return (
    <div className='flex flex-col gap-2 max-h-200px overflow-auto relative' ref={scroll.ref.container}>
      {data.map(it => 
        <UserItem data={it} />,
      )}
    </div>
  );
});

const UserItem = ({ data }: { data: User }) => {
  const { scroll, user } = useHooks();
  const handleClick = () => {
    const el = scroll.ref.items.current[data.id];

    user.setUser(data);
    scroll.ref.container.current?.scrollTo({
      top: el?.offsetTop,
      behavior: 'smooth',
    });
  };
  
  return (
    <Button
      className='cursor-pointer'
      ref={el => {
        if (el) {
          scroll.ref.items.current[data.id] = el;
        }
      }}
      onClick={handleClick} 
      variant={user.user?.id === data.id ? 'default' : 'secondary'} key={data.id}
    >
      {data.name}
    </Button>
  );
};

export default () => {
  return (
    <ScrollApp />
  );
};