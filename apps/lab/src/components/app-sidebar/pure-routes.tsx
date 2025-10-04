import { Collapsible, CollapsibleContent, CollapsibleTrigger, SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@sokutils/shadcn-ui';
import { useMatches, useNavigate, useRouter } from '@tanstack/react-router';
import { chain } from 'lodash-es';

export const PureRoutes = () => {
  const router = useRouter();
  const root = router.routeTree;
  const match = useMatches().at(-1);
  const nav = useNavigate();

  const pureRoutes = chain(root.children)
    .values()
    .filter(r => r.fullPath.includes('/pure'))
    .sortBy(r => r.options.staticData.priority)
    .value();

  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger>
          <SidebarMenuButton>
            Pure
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='font-mono'>
          <SidebarMenu>
            {pureRoutes.map(r => 
              <SidebarMenuItem key={r.id}>
                <SidebarMenuButton isActive={match?.id === r.id} onClick={() => nav({ to: r.fullPath })}>
                  {r.options.staticData.title}
                </SidebarMenuButton>
              </SidebarMenuItem>,
            )}
          </SidebarMenu>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};