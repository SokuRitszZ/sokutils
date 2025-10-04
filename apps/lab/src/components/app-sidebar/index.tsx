import { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@sokutils/shadcn-ui';
import { useNavigate } from '@tanstack/react-router';
import { PureRoutes } from './pure-routes';
import { MainRoutes } from './main-routes';

export const AppSidebar = () => {
  const nav = useNavigate();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => nav({ to: '/home' })}
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a> ✨ <span className="text-base font-semibold">Sokutils</span> </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <MainRoutes />
        <PureRoutes />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};