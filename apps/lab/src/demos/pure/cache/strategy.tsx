import { Button } from '@sokutils/shadcn-ui';
import { divx, divy } from '@sokutils/react';
import { useMemo, useState } from 'react';
import { createCachedByStrategy, getStrategyCallCount, resetStrategyCallCount } from './strategy.code';

const UI = {
  Layout: divx({}, 'flex flex-col gap-3'),
  Row: divx({}, 'flex items-center gap-2 flex-wrap'),
  Panel: divx({}, 'grid grid-cols-4 gap-2 text-sm'),
  Metric: divx({}, 'rounded-md border border-border bg-muted/40 p-3'),
  Label: divy('div', {}, 'text-muted-foreground text-xs'),
  Value: divy('div', {}, 'font-mono font-medium mt-1 break-all'),
};

type Mode = Parameters<typeof createCachedByStrategy>[0];

export default () => {
  const [mode, setMode] = useState<Mode>('lru');
  const [key, setKey] = useState('a');
  const [calls, setCalls] = useState(0);
  const [value, setValue] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);

  const cached = useMemo(() => {
    return createCachedByStrategy(mode);
  }, [mode]);

  const handleCall = () => {
    const next = cached(key);
    setValue(next);
    setCalls(getStrategyCallCount());
    setSequence(x => [next, ...x].slice(0, 5));
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setValue('');
    setSequence([]);
    resetStrategyCallCount();
    setCalls(0);
  };

  return (
    <UI.Layout>
      <UI.Row>
        {(['lru', 'timeout', 'expireAt'] as const).map(x => (
          <Button key={x} variant={mode === x ? 'default' : 'secondary'} onClick={() => handleModeChange(x)}>
            {x}
          </Button>
        ))}
        {(['a', 'b', 'c'] as const).map(x => (
          <Button key={x} variant={key === x ? 'outline' : 'ghost'} onClick={() => setKey(x)}>
            {x}
          </Button>
        ))}
        <Button variant='outline' onClick={handleCall}>
          <div className='i-tabler:bolt' />
          Call
        </Button>
      </UI.Row>
      <UI.Panel>
        <UI.Metric>
          <UI.Label>strategy</UI.Label>
          <UI.Value>{mode}</UI.Value>
        </UI.Metric>
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
      <div className='text-xs text-muted-foreground font-mono'>
        {sequence.length ? sequence.join(' -> ') : 'no calls yet'}
      </div>
    </UI.Layout>
  );
};
