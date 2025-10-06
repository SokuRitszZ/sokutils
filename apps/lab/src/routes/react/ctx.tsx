import { createFileRoute } from '@tanstack/react-router';
import Props from '../../demos/react/ctx/props?demo';
import Model from '../../demos/react/ctx/model?demo';
import Hooks from '../../demos/react/ctx/hooks?demo';

export const Route = createFileRoute('/react/ctx')({
  component: RouteComponent,
  staticData: {
    title: 'ctx',
    priority: 1,
  },
});

function RouteComponent() {
  return <div className='grid grid-cols-3 items-stretch gap-2'>
    <Props />
    <Model />
    <Hooks />
  </div>;
}
