import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/pure/iife')({
  component: RouteComponent,
  staticData: {
    title: 'iife',
    priority: 1,
  },
});

function RouteComponent() {
  return <div>Hello "/pure/iife"!</div>;
}
