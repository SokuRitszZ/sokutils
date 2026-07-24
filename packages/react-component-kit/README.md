# React Component Kit

`@sokutils/react-component-kit` creates typed React components from HTML tags or
existing components, then composes their `className` from reusable configuration.

It provides three public APIs:

- `rck`: create a component from an HTML tag.
- `Rck`: wrap an existing React component.
- `layout`: create a typed CSS Grid layout from a text template.

## Installation

```bash
pnpm add @sokutils/react-component-kit
```

React and React DOM are peer dependencies:

```bash
pnpm add react react-dom
```

## Quick start

```tsx
import { rck } from '@sokutils/react-component-kit';

const Button = rck.button(
  'rounded px-4 py-2 transition-colors',
  {
    active: 'bg-blue-600 text-white',
  },
  {
    tone: {
      neutral: ['bg-gray-100 text-gray-900'],
      danger: ['bg-red-600 text-white'],
    },
  },
);

export const Example = () => (
  <Button active tone='danger' onClick={() => console.log('clicked')}>
    Delete
  </Button>
);
```

`Button` retains the native button props and ref type. The generated configuration
props are inferred as:

```ts
{
  active?: boolean;
  tone?: 'neutral' | 'danger';
}
```

## `rck`: HTML components

Use a tag method for the common form:

```tsx
const Stack = rck.div(
  'flex flex-col gap-3',
);

const Link = rck.a(
  'underline underline-offset-4',
);
```

The callable form is also available when the tag is dynamic:

```tsx
const Section = rck('section', 'mx-auto max-w-screen-lg');
```

Every generated component:

- accepts the native props for its tag;
- accepts `children` and `className`;
- forwards a correctly typed ref;
- merges configured classes with the `className` supplied at render time.

```tsx
import { useRef } from 'react';

const Input = rck.input('rounded border px-3 py-2');

const Example = () => {
  const ref = useRef<HTMLInputElement>(null);

  return <Input ref={ref} placeholder='Name' />;
};
```

Define generated components outside React render functions so their identity stays
stable between renders.

## Configuration

`rck` and `Rck` accept any number of configuration arguments. A configuration is
either an unconditional class string or a prop-driven configuration object.

### Unconditional classes

Strings are always included:

```tsx
const Card = rck.div(
  'rounded-lg border',
  'bg-white p-4',
);
```

Later arguments have higher priority when Tailwind classes conflict.

### Boolean classes

A class value is included when the corresponding prop is truthy. It can be a
single string or an array of strings:

```tsx
const Card = rck.div(
  {
    selected: 'border-blue-500 bg-blue-50',
    disabled: ['cursor-not-allowed', 'opacity-50'],
  },
  'rounded border p-4',
);

<Card selected />
<Card disabled />
```

The generated props are optional booleans:

```ts
{
  selected?: boolean;
  disabled?: boolean;
}
```

### False/true classes

Use a pair of class lists when both boolean states need styles. The first list is
used for `false`; the second is used for `true`.

```tsx
const Toggle = rck.button(
  {
    checked: [
      ['bg-gray-200 text-gray-900'],
      ['bg-blue-600 text-white'],
    ],
  },
  'rounded px-3 py-2',
);

<Toggle checked={false}>Off</Toggle>
<Toggle checked>On</Toggle>
```

### Variants

Use an object whose keys are prop values and whose values are class values. A class
value can be a string or an array of strings:

```tsx
const Badge = rck.span(
  {
    tone: {
      neutral: 'bg-gray-100 text-gray-800',
      success: ['bg-green-100 text-green-800'],
      danger: 'bg-red-100 text-red-800',
    },
  },
  'inline-flex rounded px-2 py-1 text-sm',
);

<Badge tone='success'>Ready</Badge>
```

TypeScript infers:

```ts
tone?: 'neutral' | 'success' | 'danger';
```

Variant keys without a matching runtime prop do not add classes. Put the default
classes in a string argument:

```tsx
const Button = rck.button(
  'bg-blue-600 text-white',
  {
    tone: {
      danger: 'bg-red-600 text-white',
      ghost: 'bg-transparent text-gray-900',
    },
  },
);
```

### Composition and priority

Configurations are evaluated from left to right and merged with `tailwind-merge`.
The render-time `className` is merged last:

```tsx
const Box = rck.div(
  'bg-gray-100 p-2',
  { active: ['bg-blue-500'] },
);

<Box active className='bg-green-500' />
```

The final background is `bg-green-500`.

## `Rck`: existing components

Use `Rck` when the target is a React component rather than an intrinsic HTML tag:

```tsx
import { Rck } from '@sokutils/react-component-kit';
import { SidebarProvider } from './sidebar';

const Window = Rck(
  SidebarProvider,
  'flex min-h-screen items-stretch',
  { compact: 'gap-1' },
);

<Window compact>
  ...
</Window>
```

The wrapped component keeps its original props. Configuration props are added using
the same inference rules as `rck`.

The target component must accept and apply a `className` prop for the generated
classes to affect its output. To use `ref`, the target must also forward its ref.

```tsx
import { forwardRef } from 'react';

interface PanelProps {
  className?: string;
  title: string;
}

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  ({ className, title }, ref) => (
    <div ref={ref} className={className}>
      {title}
    </div>
  ),
);

const StyledPanel = Rck(
  Panel,
  'rounded border p-4',
  { highlighted: 'border-amber-500' },
);
```

## `layout`: typed grid layouts

`layout` converts a whitespace-separated template into a CSS Grid component. Each
named area becomes a typed static component on the returned layout.

```tsx
import { layout } from '@sokutils/react-component-kit';

const AppLayout = layout(`
header  -       -
sidebar content aside
+       +       aside
footer  -       -
`, {
  rows: 'auto 1fr auto auto',
  cols: 'auto 1fr auto',
});

export const Page = () => (
  <AppLayout className='min-h-screen'>
    <AppLayout.Header>Header</AppLayout.Header>
    <AppLayout.Sidebar>Navigation</AppLayout.Sidebar>
    <AppLayout.Content>Main content</AppLayout.Content>
    <AppLayout.Aside>Aside</AppLayout.Aside>
    <AppLayout.Footer>Footer</AppLayout.Footer>
  </AppLayout>
);
```

Template symbols:

- a name creates a grid area and a component;
- `-` repeats the area to its left;
- `+` repeats the area above it.

The main layout and every area component accept native `div` props, `className`,
`children`, and `ref`.

## Type exports

The package exports the types used by the factories, including:

```ts
HTMLTag
RCKConfig
RCKConfigStatusMap
RCKHtml
RCKHtmlProps
RCKComponentProps
RCKConfigConvert
RCKConfigRestConvert
Layout
LayoutFormat
```

Prefer deriving component props and refs with React's standard helpers:

```ts
type ButtonProps = React.ComponentProps<typeof Button>;
type ButtonRef = React.ComponentRef<typeof Button>;
```

## Migration from the old API

```tsx
// Before
divx({}, 'flex gap-2');
divy('button', {}, 'rounded px-3 py-2');
divz(Component, {}, 'flex items-center');

// After
rck.div('flex gap-2');
rck.button('rounded px-3 py-2');
Rck(Component, 'flex items-center');
```

String-valued conditional configuration remains valid. Arrays are only needed when
it is clearer to keep class fragments separate:

```tsx
// Before
divx({ active: 'bg-blue-500' });

// After
rck.div({ active: 'bg-blue-500' });

// Also valid
rck.div({ active: ['bg-blue-500', 'text-white'] });
```
