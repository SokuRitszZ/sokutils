import { rck } from '@sokutils/react-component-kit';
import { Collapsible, SidebarGroup, SidebarMenuButton, SidebarMenu, SidebarMenuItem, SidebarGroupContent, SidebarGroupLabel } from '@sokutils/shadcn-ui';
import { useRouter, useMatches, useNavigate } from '@tanstack/react-router';
import { sortBy, values } from 'es-toolkit/compat';

interface Props {
  prefix: string;
  title: string;
  icon?: string;
}

const Icon = rck.div('size-1em mr-1');

export const GroupedRoutes = ({ icon, title, prefix }: Props) => {
  const router = useRouter();
  const root = router.routeTree;
  const match = useMatches().at(-1);
  const nav = useNavigate();

  const pureRoutes = sortBy(
    values(root.children).filter(r => r.fullPath.startsWith(prefix)),
    [r => r.options.staticData.priority],
  );
  
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel> 
          {icon && <Icon className={icon} />}
          {title}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {pureRoutes.map(r => 
              <SidebarMenuItem key={r.id}>
                <SidebarMenuButton className='font-mono' isActive={match?.id === r.id} onClick={() => nav({ to: r.fullPath })}>
                  {r.options.staticData.title}
                </SidebarMenuButton>
              </SidebarMenuItem>,
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </Collapsible>
  );
};
