import { createFileRoute } from '@tanstack/react-router';

import Basic from '@demos/pure/iife/basic';
import { L } from '../../components/layout';

export const Route = createFileRoute('/pure/iife')({
  component: RouteComponent,
  staticData: {
    title: 'iife',
    priority: 1,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Basic />
    </L.Demo>
  );
}
