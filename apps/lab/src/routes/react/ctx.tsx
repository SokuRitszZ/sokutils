import { createFileRoute } from '@tanstack/react-router';
import Hooks from '@demos/react/ctx/hooks';
import Model from '@demos/react/ctx/model';
import Props from '@demos/react/ctx/props';
import { L } from '../../components/layout';

export const Route = createFileRoute('/react/ctx')({
  component: RouteComponent,
  staticData: {
    title: 'ctx',
    priority: 1,
  },
});

function RouteComponent() {
  return (
    <L.Demo>
      <Props />
      <Model />
      <Hooks />
    </L.Demo>
  );
}
