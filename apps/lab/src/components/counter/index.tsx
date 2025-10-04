import { Button } from '@sokutils/shadcn-ui';
import { model, useModel } from './ctx';

const RCounter = () => {
  return (
    <div className='flex items-center gap-4'>
      <ResetBtn />
      <AddBtn />
    </div>
  );
};

const ResetBtn = () => {
  const { count, setCount } = useModel();
  
  return (
    <Button onClick={() => setCount(0)}>{count}</Button>
  );
};

const AddBtn = () => {
  const { setCount } = useModel();
  
  return (
    <Button onClick={() => setCount(c => c + 1)}>+1</Button>
  );
};

RCounter.ResetBtn = ResetBtn;
RCounter.AddBtn = AddBtn;

export const Counter = model(RCounter);