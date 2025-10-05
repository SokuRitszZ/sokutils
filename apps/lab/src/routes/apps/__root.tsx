import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/apps/__root')({
  component: RouteComponent,
  staticData: {
    title: 'Demos',
    priority: 1,
  },
});

function RouteComponent() {
  return <div>Hello "/demos/__root"!</div>;
}
