import { w } from '@sokutils/react';
import { Collapsible, SidebarGroup, CollapsibleTrigger, SidebarMenuButton, CollapsibleContent, SidebarMenu, SidebarMenuItem, SidebarGroupContent, SidebarGroupLabel } from '@sokutils/shadcn-ui';
import { useRouter, useMatches, useNavigate } from '@tanstack/react-router';
import { chain } from 'lodash';

interface Props {
  prefix: string;
  title: string;
  icon?: string;
}

const Icon = w('div', {}, 'size-1em mr-1');

export const GroupedRoutes = ({ icon, title, prefix }: Props) => {
  const router = useRouter();
  const root = router.routeTree;
  const match = useMatches().at(-1);
  const nav = useNavigate();

  const pureRoutes = chain(root.children)
    .values()
    .filter(r => r.fullPath.startsWith(prefix))
    .sortBy(r => r.options.staticData.priority)
    .value();
  
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