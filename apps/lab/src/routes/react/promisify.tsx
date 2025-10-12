import { createFileRoute } from '@tanstack/react-router';
import Basic from '@demos/react/promisify/basic';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/promisify')({
  component: RouteComponent,
  staticData: {
    title: 'promisify',
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
