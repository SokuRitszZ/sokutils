# React Context

`@sokutils/react-context` provides typed factories for sharing component props,
state models, and hook results through React context.

It exposes three APIs through the `ctx` namespace:

- `ctx.props`: expose a component's props to its descendants.
- `ctx.model`: create shared state values with typed React state setters.
- `ctx.hooks`: run a group of hooks and share their return values.

The individual factories `createPropsCtx`, `createModelCtx`, and
`createHooksCtx` are also exported.

## Installation

```bash
pnpm add @sokutils/react-context
```

React is a peer dependency:

```bash
pnpm add react
```

## Quick start

```tsx
import { ctx } from '@sokutils/react-context';

interface Model {
  count: number;
}

const [withCounterModel, useCounterModel] = ctx.model<Model>({
  count: 0,
});

const CounterView = () => {
  const { count, setCount } = useCounterModel();

  return (
    <button onClick={() => setCount(current => current + 1)}>
      Count: {count}
    </button>
  );
};

export const Counter = withCounterModel(CounterView);
```

Create context factories at module scope. Each factory returns a tuple containing:

1. a higher-order component that provides the context;
2. a hook that consumes the context.

## `ctx.props`

`ctx.props` makes a wrapper component's props available anywhere below the
wrapped component:

```tsx
import { ctx } from '@sokutils/react-context';

interface ProfileProps {
  name: string;
  role: string;
}

const [withProfileProps, useProfileProps] = ctx.props<ProfileProps>();

const ProfileName = () => {
  const { name, role } = useProfileProps();
  return <strong>{name} · {role}</strong>;
};

const ProfileView = () => <ProfileName />;

export const Profile = withProfileProps(ProfileView);

<Profile name='Ada' role='Engineer' />;
```

The returned wrapper accepts `ProfileProps`. The wrapped component consumes those
props through `useProfileProps` instead of receiving them directly.

## `ctx.model`

`ctx.model` converts an initial model into shared state values and setters:

```tsx
interface EditorModel {
  title: string;
  published?: boolean;
}

const [withEditorModel, useEditorModel] = ctx.model<EditorModel>({
  title: '',
  published: undefined,
});

const EditorView = () => {
  const {
    title,
    setTitle,
    published,
    setPublished,
  } = useEditorModel();

  return (
    <>
      <input value={title} onChange={event => setTitle(event.target.value)} />
      <button onClick={() => setPublished(value => !value)}>
        {published ? 'Published' : 'Draft'}
      </button>
    </>
  );
};

export const Editor = withEditorModel(EditorView);
```

Each model key produces a setter named `set${Capitalize<Key>}`. The setter has
the same type as the setter returned by React's `useState`, so it accepts either
a value or an updater function.

Optional model keys still need an explicit initial value:

```tsx
ctx.model<EditorModel>({
  title: '',
  published: undefined,
});
```

Each mounted provider owns an independent model instance.

## `ctx.hooks`

`ctx.hooks` composes named hooks and exposes their resolved return values:

```tsx
import { useRef, useState } from 'react';

const useSelection = () => {
  const [selectedId, setSelectedId] = useState<string>();
  return { selectedId, setSelectedId };
};

const useViewport = () => {
  const container = useRef<HTMLDivElement>(null);
  return { container };
};

const [withListHooks, useListHooks] = ctx.hooks({
  selection: useSelection,
  viewport: useViewport,
});

const ListView = () => {
  const { selection, viewport } = useListHooks();

  return (
    <div ref={viewport.container}>
      <button onClick={() => selection.setSelectedId('first')}>
        {selection.selectedId ?? 'Select'}
      </button>
    </div>
  );
};

export const List = withListHooks(ListView);
```

The keys and return types are inferred from the hook map. Hook factories must obey
the Rules of Hooks and should remain stable between renders.

## Composing contexts

Context wrappers can be composed when a component needs more than one context:

```tsx
const [withProps, useProps] = ctx.props<PageProps>();
const [withModel, useModel] = ctx.model<PageModel>({
  editing: false,
});
const [withHooks, useHooks] = ctx.hooks({
  data: usePageData,
});

const RawPage = () => {
  const props = useProps();
  const model = useModel();
  const hooks = useHooks();

  return <PageContent {...{ props, model, hooks }} />;
};

export const Page = withProps(withModel(withHooks(RawPage)));
```

The outer wrappers are mounted first. A hook resolved by `ctx.hooks` can only
consume a context whose provider is outside the hooks wrapper.

## Preserving component statics

Each higher-order component accepts an optional second argument containing
additional static fields:

```tsx
const Page = withModel(RawPage, {
  Header: PageHeader,
});

<Page.Header />;
```

Existing enumerable static fields from the wrapped component are copied as well.

## Usage rules

- Define factories and wrapped components at module scope.
- Call the consumer hook only below its matching provider.
- Do not conditionally create or call hook maps.
- Give every optional model property an explicit initial value.
- Use different factories when separate provider instances should not share a
  context type.

