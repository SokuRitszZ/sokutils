import { ctx } from '@sokutils/react';
import { Button, Input } from '@sokutils/shadcn-ui';
import { get } from 'lodash-es';

interface Model {
  count: number;
  char?: string;
}

const [hoc, useModel] = ctx.model<Model>({
  count: 0,
  char: undefined,
});

const Counter = hoc(() => {
  const { count, setCount, char, setChar } = useModel();
  return (
    <div className='grid grid-cols-[auto_minmax(0,1fr)] gap-2'>
      <Button onClick={() => setCount(c => c + 1)}><div className='i-tabler:plus' />{count}</Button>
      <div className=''>
        <Input value={char} onChange={e => setChar(get(e.target, 'value') ?? '')} />
        <div className='overflow-hidden text-primary'> {char || '<undefined>'} </div>
      </div>
    </div>
  );
});

export default () => {
  return (
    <Counter />
  );
};