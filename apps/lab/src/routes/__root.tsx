import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SidebarProvider, SidebarTrigger } from '@sokutils/shadcn-ui';
import { AppSidebar } from '../components/app-sidebar';

const RootLayout = () => {

  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </SidebarProvider>
  );
};


export const Route = createRootRoute({ 
  component: RootLayout,
  staticData: {
    title: '',
    priority: 0,
  },
});