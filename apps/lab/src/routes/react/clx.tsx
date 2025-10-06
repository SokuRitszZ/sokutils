import { createFileRoute } from '@tanstack/react-router';
import Basic from '../../demos/react/clx/basic?demo';
import Boolean from '../../demos/react/clx/boolean?demo';
import Variants from '../../demos/react/clx/variants?demo';

export const Route = createFileRoute('/react/clx')({
  component: RouteComponent,
  staticData: {
    title: 'clx',
    priority: 2,
  },
});

function RouteComponent() {
  return (
    <div className='flex flex-col items-stretch gap-4'>
      <Basic />
      <Boolean />
      <Variants />
    </div>
  );
}
