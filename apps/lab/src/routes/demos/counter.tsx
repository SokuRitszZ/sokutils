import { createFileRoute } from '@tanstack/react-router';
import { Counter } from '../../components/counter';

export const Route = createFileRoute('/demos/counter')({
  component: RouteComponent,
  staticData: {
    title: 'counter',
    priority: 1,
  },
});

function RouteComponent() {
  return (
    <div className='size-full tw-center'>
      <Counter />
    </div>
  );
}
