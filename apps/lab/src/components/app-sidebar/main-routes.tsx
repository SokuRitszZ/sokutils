import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, cn } from '@sokutils/shadcn-ui';
import { sortBy, values } from 'es-toolkit/compat';
import { useMatches, useNavigate, useRouter } from '@tanstack/react-router';

export const MainRoutes = () => {
  const root = useRouter().routeTree;
  const nav = useNavigate();
  const match = useMatches().at(-1);
  const routes = values(root.children);
  const mains = sortBy(
    routes.filter(r => !!r.options.staticData.isMain),
    [r => r.options.staticData.priority],
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {mains.map(route => 
            <SidebarMenuItem key={route.id}>
              <SidebarMenuButton 
                isActive={match?.id === route.id}
                onClick={() => nav({ to: route.fullPath })} tooltip={route.options.staticData.title}
              >
                <div className={cn(route.options.staticData.icon, 'size-1em')} />
                <span>{route.options.staticData.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>,
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>);
};
