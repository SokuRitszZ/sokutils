import { createFileRoute } from '@tanstack/react-router';
import Basic from '@demos/react/layout/basic';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/layout')({
  component: RouteComponent,
  staticData: {
    title: 'layout',
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
