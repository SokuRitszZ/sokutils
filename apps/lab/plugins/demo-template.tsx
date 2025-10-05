import { DemoCard } from 'demo-card';

import code from '__ORIGIN_DEMO_FILE__?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import meta from '__ORIGIN_DEMO_FILE__.meta.toml';
import { lazy, Suspense } from 'react';

const Demo = lazy(async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const imp = import('__ORIGIN_DEMO_FILE__')
    .then(({ default: d }) => {
      if (!d) {
        throw new Error;
      }
      return d;
    });

  const X = await imp
    .then(d => d)
    .catch(() => () => <div className='text-secondary hover:text-border duration-200'>{'<no content>'}</div>);

  return { default: X };
});

export default () => 
  <DemoCard
    title={meta.title}
    description={meta.description}
    content={<Demo />}
    code={code}
  />;
