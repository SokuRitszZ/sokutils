import { createRootRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Button } from '@sokutils/shadcn-ui';

const RootLayout = () => {

  const nav = useNavigate();

  return <>
    <div className="p-2 flex gap-2">
      <Button variant='link' onClick={() => nav({ to: '/home' })}>HOME</Button>
      <Button variant='link' onClick={() => nav({ to: '/about' })}>ABOUT</Button>
    </div>
    <hr />
    <Outlet />
    <TanStackRouterDevtools />
  </>;
};


export const Route = createRootRoute({ component: RootLayout });