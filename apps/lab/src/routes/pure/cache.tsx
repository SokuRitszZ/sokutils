import { createFileRoute } from '@tanstack/react-router';

import Basic from '@demos/pure/cache/basic';
import Builder from '@demos/pure/cache/builder';
import Strategy from '@demos/pure/cache/strategy';
import { L } from '../../components/layout';

export const Route = createFileRoute('/pure/cache')({
  component: RouteComponent,
  staticData: {
    title: 'Cache',
    priority: 3,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Basic />
      <Builder />
      <Strategy />
    </L.Demo>
  );
}
