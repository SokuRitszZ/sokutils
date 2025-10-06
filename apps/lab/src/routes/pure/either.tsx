import { createFileRoute } from '@tanstack/react-router';
import Basic from '../../demos/pure/either/basic?demo';

export const Route = createFileRoute('/pure/either')({
  component: RouteComponent,
  staticData: {
    title: 'either',
    priority: 2,
  },
});

function RouteComponent() {
  return (
    <div>
      <Basic />
    </div>
  );
}
