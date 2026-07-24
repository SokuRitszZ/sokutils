import { rck } from '@sokutils/react-component-kit';
import { Button } from '@sokutils/shadcn-ui';
import { useState } from 'react';
import { callCachedBasic, getBasicCallCount } from './basic.code';

const UI = {
  Layout: rck.div('flex flex-col gap-3'),
  Row: rck.div('flex items-center gap-2 flex-wrap'),
  ButtonGroup: rck.div('flex items-center gap-2'),
  Panel: rck.div('grid grid-cols-3 gap-2 text-sm'),
  Metric: rck.div('rounded-md border border-border bg-muted/40 p-3'),
  Label: rck.div('text-muted-foreground text-xs'),
  Value: rck.div('font-mono font-medium mt-1 break-all'),
};

export default () => {
  const [calls, setCalls] = useState(0);
  const [key, setKey] = useState('alpha');
  const [value, setValue] = useState('');

  const handleCall = () => {
    setValue(callCachedBasic(key));
    setCalls(getBasicCallCount());
  };

  return (
    <UI.Layout>
      <UI.Row>
        <UI.ButtonGroup>
          <Button variant={key === 'alpha' ? 'default' : 'secondary'} onClick={() => setKey('alpha')}>alpha</Button>
          <Button variant={key === 'beta' ? 'default' : 'secondary'} onClick={() => setKey('beta')}>beta</Button>
        </UI.ButtonGroup>
        <Button variant='outline' onClick={handleCall}>
          <div className='i-tabler:player-play' />
          Call cached fn
        </Button>
      </UI.Row>
      <UI.Panel>
        <UI.Metric>
          <UI.Label>key</UI.Label>
          <UI.Value>{key}</UI.Value>
        </UI.Metric>
        <UI.Metric>
          <UI.Label>value</UI.Label>
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
