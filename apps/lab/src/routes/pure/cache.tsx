import { createFileRoute } from '@tanstack/react-router';

import Basic from '@demos/pure/cache/basic';
import { L } from '../../components/layout';

export const Route = createFileRoute('/pure/cache')({
  component: RouteComponent,
  staticData: {
    title: 'cache',
    priority: 3,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Basic />
    </L.Demo>
  );
}
