import { createFileRoute } from '@tanstack/react-router';
import Basic from '@demos/react/clx/basic';
import Boolean from '@demos/react/clx/boolean';
import Variants from '@demos/react/clx/variants';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/clx')({
  component: RouteComponent,
  staticData: {
    title: 'clx',
    priority: 2,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Basic />
      <Boolean />
      <Variants />
    </L.Demo>
  );
}
