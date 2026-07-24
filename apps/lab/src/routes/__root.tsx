import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Rck, rck } from '@sokutils/react-component-kit';
import { SidebarProvider, SidebarTrigger, Toaster } from '@sokutils/shadcn-ui';
import { CSSProperties } from 'react';
import { AppSidebar } from '../components/app-sidebar';

const Layout = {
  Window: Rck(SidebarProvider, 'flex items-stretch'),
  Main: rck.main('flex-1 flex flex-col'),
  Header: rck.header('mx-4 h-3em', 'flex items-center gap-4', 'border-b-1px border-b-#eee'),
  Content: rck.main('w-full h-[calc(100vh-4em)] flex overflow-auto px-4 py-4'),
};

const Fold = rck.div('i-tabler:layout-sidebar size-1.5em');
const sidebarStyle = {
  '--sidebar-width': '20rem',
} as CSSProperties;

const RootLayout = () => {
  return (
    <Layout.Window style={sidebarStyle}>
      <Toaster />
      <AppSidebar />
      <Layout.Main>
        <Layout.Header>
          <SidebarTrigger>
            <Fold />
          </SidebarTrigger>
        </Layout.Header>
        <Layout.Content>
          <Outlet />
        </Layout.Content>
      </Layout.Main>
      <TanStackRouterDevtools />
    </Layout.Window>
  );
};


export const Route = createRootRoute({ 
  component: RootLayout,
  staticData: {
    title: '',
    priority: 0,
  },
});
