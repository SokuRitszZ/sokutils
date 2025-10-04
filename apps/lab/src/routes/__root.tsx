import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { SidebarProvider, SidebarTrigger } from '@sokutils/shadcn-ui';
import { w } from '@sokutils/react';
import { AppSidebar } from '../components/app-sidebar';

const Header = w('header', {}, 'mx-4 h-3em', 'flex items-center gap-4', 'border-b-1px border-b-#eee');
const Content = w('main', {}, 'w-full h-[calc(100vh-4em)] flex overflow-auto px-4');
const Fold = w('div', {}, 'i-tabler:layout-sidebar size-1.5em');

const RootLayout = () => {
  return (
    <SidebarProvider className='flex items-stretch'>
      <AppSidebar />
      <main className='flex-1 flex flex-col'>
        <Header>
          <SidebarTrigger>
            <Fold />
          </SidebarTrigger>
        </Header>
        <Content>
          <Outlet />
        </Content>
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