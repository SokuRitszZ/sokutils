import { createFileRoute } from '@tanstack/react-router';
import Basic from '@demos/react/rck/basic';
import Conditions from '@demos/react/rck/conditions';
import Variants from '@demos/react/rck/variants';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/rck')({
  component: RouteComponent,
  staticData: {
    title: 'React Component Kit (RCK)',
    priority: 2,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Basic />
      <Conditions />
      <Variants />
    </L.Demo>
  );
}
