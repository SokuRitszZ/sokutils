import { clx } from '@sokutils/react';
import { Switch, Tabs, TabsList, TabsTrigger } from '@sokutils/shadcn-ui';
import { keys } from 'lodash-es';
import { useState } from 'react';

const btn = {
  vars: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive:
      'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
    outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
    secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
    link: 'text-primary underline-offset-4 hover:underline',
  },
  size: {
    default: 'h-9 px-4 py-2 has-[>svg]:px-3',
    sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
    lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
    icon: 'size-9',
    'icon-sm': 'size-8',
    'icon-lg': 'size-10',
  },
};

const Button = clx.w(
  'button',
  {
    variant: clx.vars(btn.vars, 'default'),
    size: clx.vars(btn.size, 'default'),
    disabled: 'pointer-events-none opacity-50',
  },
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
);

const Layout = clx.w('div', {}, 'flex flex-col items-start gap-2');
const FormItem = clx.w('div', {}, 'grid grid-cols-[100px_auto] items-center', 'mt-2');

export default () => {
  const [variant, setVariant] = useState<string>();
  const [size, setSize] = useState<string>();
  const [disabled, setDisabled] = useState<boolean>();
  
  return (
    <Layout>
      <FormItem>
        <span>variant</span>
        <Tabs onValueChange={setVariant} value={variant}>
          <TabsList>
            {keys(btn.vars).map(x => <TabsTrigger value={x}>{x}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </FormItem>
      <FormItem>
        <span>size</span>
        <Tabs onValueChange={setSize} value={size}>
          <TabsList>
            {keys(btn.size).map(x => <TabsTrigger value={x}>{x}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </FormItem>
      <FormItem>
        <span>disabled</span>
        <Switch checked={disabled} onCheckedChange={setDisabled} />
      </FormItem>
      <Button
        variant={variant as keyof typeof btn.vars}
        size={size as keyof typeof btn.size}
        disabled={disabled}
      >
        <div className='i-tabler:click' />
        {!size?.includes('icon') && 'click'}
      </Button>
    </Layout>
  );
};