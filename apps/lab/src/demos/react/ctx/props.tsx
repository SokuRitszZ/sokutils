import { ctx } from '@sokutils/react';
import { Input } from '@sokutils/shadcn-ui';
import { get } from 'lodash-es';
import { useState } from 'react';

interface Props {
  name: string;
}

const [hoc, useProps] = ctx.props<Props>();

const Displayer = hoc(() => {
  const { name } = useProps();
  return (
    <div>
      name: <pre className='inline-block'>{name}</pre>
    </div>
  );
});

export default () => {
  const [name, setName] = useState('');
  return (
    <div>
      <Input value={name} onInput={e => setName(get(e.target, 'value') ?? '')} />
      <div className='mt-2'>
        <Displayer name={name} />
      </div>
    </div>
  );
};