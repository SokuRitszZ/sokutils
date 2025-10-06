import { DemoCard } from 'demo-card';

import code from '__ORIGIN_DEMO_FILE__?raw';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import meta from '__ORIGIN_DEMO_FILE__.meta.toml';
import { lazy, Suspense, useEffect, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const imp = import('__ORIGIN_DEMO_FILE__?demo-origin')
  .then(({ default: d }) => {
    if (!d) { throw new Error; }
    return d;
  });

const Demo = lazy(async () => {
  const X = await imp
    .then(d => d)
    .catch(() => () => <div className='text-secondary hover:text-border duration-200'>{'<no content>'}</div>);

  return { default: X };
});

export default () => {
  const [noContent, setNoContent] = useState(true);

  useEffect(() => {
    imp.then(() => setNoContent(false));
  }, []);
  
  return (
    <Suspense
      fallback={
        <DemoCard
          title={meta.title}
          description={meta.description}
          noContent
          content={undefined}
          code={code}
        />
      }
    >
      <DemoCard
        title={meta.title}
        description={meta.description}
        noContent={noContent}
        content={<Demo />}
        code={code}
      />
    </Suspense>
  );
};
