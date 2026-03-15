import { createFileRoute } from '@tanstack/react-router';
import Basic from '@demos/react/div/basic';
import Boolean from '@demos/react/div/boolean';
import Variants from '@demos/react/div/variants';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/div')({
  component: RouteComponent,
  staticData: {
    title: 'div',
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
