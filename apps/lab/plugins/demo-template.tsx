import { DemoCard } from 'demo-card';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import Demo from '__ORIGIN_DEMO_FILE__';
import code from '__ORIGIN_DEMO_FILE__?raw';

export default () => 
  <DemoCard
    title="iife"
    description="iife demo"
    content={<Demo />}
    code={code}
  />;
