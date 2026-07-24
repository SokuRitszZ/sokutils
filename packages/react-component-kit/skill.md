# React Component Kit Coding Guide

Use this guide when creating or migrating components with
`@sokutils/react-component-kit`.

## Public API

```tsx
import { Rck, layout, rck } from '@sokutils/react-component-kit';
```

- Use `rck.tag(...)` for intrinsic HTML elements.
- Use `Rck(Component, ...)` for existing React components.
- Use `layout(template, tracks)` for named CSS Grid layouts.
- Do not introduce new `divx`, `divy`, `divz`, or `divVariants` usages.

## Component placement

Create generated components at module scope:

```tsx
const Stack = rck.div('flex flex-col gap-3');

export const View = () => <Stack />;
```

Do not create them during render:

```tsx
export const View = () => {
  // Avoid: a new component type is created on every render.
  const Stack = rck.div('flex flex-col gap-3');
  return <Stack />;
};
```

## Intrinsic elements

Choose the semantic tag directly:

```tsx
const UI = {
  Root: rck.main('mx-auto max-w-screen-lg'),
  Header: rck.header('flex items-center justify-between'),
  Button: rck.button('rounded px-3 py-2'),
  Code: rck.pre('overflow-auto whitespace-pre-wrap'),
};
```

Generated components preserve native tag props and refs. Do not manually redeclare
`children`, `className`, event handlers, ARIA attributes, or the ref type.

## Configuration forms

### Static classes

```tsx
const Stack = rck.div(
  'flex flex-col',
  'gap-3',
);
```

### Truthy boolean

Use a string or an array of strings:

```tsx
const Item = rck.div({
  selected: 'bg-blue-500 text-white',
  disabled: ['cursor-not-allowed', 'opacity-50'],
});

<Item selected />
```

This infers `selected?: boolean`.

### False/true boolean

Use a pair. Index `0` is false and index `1` is true:

```tsx
const Toggle = rck.button({
  checked: [
    ['bg-gray-200'],
    ['bg-blue-500'],
  ],
});
```

### Variant

Use a record of class values. Each value can be a string or an array of strings:

```tsx
const Button = rck.button({
  tone: {
    primary: 'bg-blue-500 text-white',
    danger: ['bg-red-500 text-white'],
  },
});
```

This infers `tone?: 'primary' | 'danger'`.

Put default classes in a separate string argument:

```tsx
const Button = rck.button(
  'bg-blue-500 text-white',
  {
    tone: {
      danger: 'bg-red-500 text-white',
      ghost: 'bg-transparent text-gray-900',
    },
  },
);
```

### Mixed configuration

Split independent concerns into separate arguments when that improves readability:

```tsx
const Button = rck.button(
  'rounded px-4 py-2',
  { disabled: 'cursor-not-allowed opacity-50' },
  {
    tone: {
      danger: 'bg-red-500 text-white',
      ghost: 'bg-transparent',
    },
  },
  {
    size: {
      sm: ['h-8 text-sm'],
      lg: ['h-10 text-lg'],
    },
  },
);
```

## Class priority

Configuration arguments are merged from left to right with `tailwind-merge`.
The consumer's `className` is merged last and therefore has the highest priority.

Use this to provide overridable defaults:

```tsx
const Box = rck.div('bg-gray-100 p-2');

<Box className='bg-white' />;
```

## Wrapping components

Use `Rck` instead of `rck` for a React component:

```tsx
const StyledDialog = Rck(
  Dialog,
  'rounded-lg border bg-white',
  { open: 'shadow-xl' },
);
```

Before wrapping, verify that the target:

1. accepts `className`;
2. applies `className` to the intended rendered element;
3. uses `forwardRef` if consumers need a ref.

Do not use `Rck` to force styling onto a component that discards `className`.

## Layouts

Use a literal template so TypeScript can infer the area component names:

```tsx
const Dashboard = layout(`
header  -
sidebar content
footer  -
`);

<Dashboard>
  <Dashboard.Header />
  <Dashboard.Sidebar />
  <Dashboard.Content />
  <Dashboard.Footer />
</Dashboard>;
```

Rules:

- `-` copies the area on the left.
- `+` copies the area above.
- Each unique name becomes a PascalCase static component.
- Provide `rows` and `cols` only when the default `1fr` tracks are insufficient.

```tsx
const Dashboard = layout(template, {
  rows: 'auto 1fr auto',
  cols: '16rem 1fr',
});
```

## Migration recipes

Apply these transformations mechanically:

```tsx
// divx
divx({}, 'a', 'b');
rck.div('a', 'b');

// divy
divy('section', {}, 'a', 'b');
rck.section('a', 'b');

// divz
divz(Component, {}, 'a', 'b');
Rck(Component, 'a', 'b');
```

String-valued conditional configuration remains valid:

```tsx
// Before
divx({ active: 'bg-blue-500' });

// After
rck.div({ active: 'bg-blue-500' });
```

Variant values may stay as strings or use string arrays:

```tsx
{
  tone: {
    primary: 'bg-blue-500',
    danger: ['bg-red-500', 'text-white'],
  },
}
```

Remove empty configuration objects. Keep imports from `@sokutils/react` only when
the file still uses another API from that package, such as `ctx` or `promisify`.

## Verification checklist

After a change:

1. Search the edited scope for `divx`, `divy`, `divz`, and `divVariants`.
2. Run the package TypeScript check.
3. Run ESLint on the edited files.
4. Build the consuming application.
5. Confirm native props, `className`, `children`, and `ref` remain inferred.
