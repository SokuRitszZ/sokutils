import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/about')({
  component: RouteComponent,
  staticData: {
    title: 'About',
    icon: 'i-tabler:info-circle',
    isMain: true,
    priority: 2,
  },
});

function RouteComponent() {
  return <div>Hello "/about"!</div>;
}
