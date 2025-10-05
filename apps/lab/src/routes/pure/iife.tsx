import { createFileRoute } from '@tanstack/react-router';
import Basic from '../../demos/pure/iife/basic?demo';

export const Route = createFileRoute('/pure/iife')({
  component: RouteComponent,
  staticData: {
    title: 'iife',
    priority: 1,
  },
});

function RouteComponent() {
  return (
    <div>
      <Basic />
    </div>
  );
}
