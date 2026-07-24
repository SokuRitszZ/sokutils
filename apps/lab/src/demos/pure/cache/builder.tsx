import { rck } from '@sokutils/react-component-kit';
import { Button } from '@sokutils/shadcn-ui';
import { useState } from 'react';
import { callCachedBuilder, clearCachedBuilder, getBuilderCallCount } from './builder.code';

const UI = {
  Layout: rck.div('flex flex-col gap-3'),
  Row: rck.div('flex items-center gap-2 flex-wrap'),
  Panel: rck.div('grid grid-cols-3 gap-2 text-sm'),
  Metric: rck.div('rounded-md border border-border bg-muted/40 p-3'),
  Label: rck.div('text-muted-foreground text-xs'),
  Value: rck.div('font-mono font-medium mt-1 break-all'),
};

export default () => {
  const [calls, setCalls] = useState(0);
  const [userId, setUserId] = useState('u-001');
  const [value, setValue] = useState('');

  const handleCall = () => {
    setValue(callCachedBuilder(userId));
    setCalls(getBuilderCallCount());
  };

  const handleClear = () => {
    clearCachedBuilder();
    window.location.reload();
  };

  return (
    <UI.Layout>
      <UI.Row>
        <Button variant={userId === 'u-001' ? 'default' : 'secondary'} onClick={() => setUserId('u-001')}>u-001</Button>
        <Button variant={userId === 'u-002' ? 'default' : 'secondary'} onClick={() => setUserId('u-002')}>u-002</Button>
        <Button variant='outline' onClick={handleCall}>
          <div className='i-tabler:database' />
          Call with storage
        </Button>
        <Button variant='ghost' onClick={handleClear}>
          <div className='i-tabler:trash' />
        </Button>
      </UI.Row>
      <UI.Panel>
        <UI.Metric>
          <UI.Label>user id</UI.Label>
          <UI.Value>{userId}</UI.Value>
        </UI.Metric>
        <UI.Metric>
          <UI.Label>cached token</UI.Label>
          <UI.Value>{value || '-'}</UI.Value>
        </UI.Metric>
        <UI.Metric>
          <UI.Label>real calls</UI.Label>
          <UI.Value>{calls}</UI.Value>
        </UI.Metric>
      </UI.Panel>
    </UI.Layout>
  );
};
