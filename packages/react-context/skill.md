# React Context Coding Guide

Use this guide when creating or migrating shared component state with
`@sokutils/react-context`.

## Public API

```tsx
import {
  createHooksCtx,
  createModelCtx,
  createPropsCtx,
  ctx,
} from '@sokutils/react-context';
```

Prefer the `ctx` namespace:

- `ctx.props<Props>()` shares a wrapper's input props.
- `ctx.model<Model>(initialModel)` creates shared state and setters.
- `ctx.hooks(hookMap)` shares resolved hook results.

Use the named factories when a codebase prefers explicit function names.

## Placement

Create factories at module scope:

```tsx
const [withModel, useModel] = ctx.model<Model>({
  count: 0,
});
```

Do not create them during render. Doing so creates a new React context and wrapper
component on every render.

## Naming

Name the tuple by responsibility:

```tsx
const [withTaskProps, useTaskProps] = ctx.props<TaskProps>();
const [withTaskModel, useTaskModel] = ctx.model<TaskModel>({
  editing: false,
});
const [withTaskHooks, useTaskHooks] = ctx.hooks({
  tasks: useTasks,
});
```

Generic names such as `hoc` and `useCtx` are acceptable only in small examples.

## Props context

Use `ctx.props` when descendants need the public props of a component without
threading them through intermediate components:

```tsx
interface DialogProps {
  title: string;
  onClose: () => void;
}

const [withDialogProps, useDialogProps] = ctx.props<DialogProps>();
```

The wrapped component receives no direct props. Its descendants consume them with
the returned hook.

## Model context

Use `ctx.model` for a small, component-scoped state model:

```tsx
interface SearchModel {
  query: string;
  selectedId?: string;
}

const [withSearchModel, useSearchModel] = ctx.model<SearchModel>({
  query: '',
  selectedId: undefined,
});
```

The consumer result contains:

```ts
{
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  selectedId: string | undefined;
  setSelectedId: Dispatch<SetStateAction<string | undefined>>;
}
```

Always initialize optional keys explicitly. Use a dedicated hook instead when
state transitions need reducers, effects, validation, or domain-specific actions.

## Hooks context

Use `ctx.hooks` to group reusable hooks behind one provider:

```tsx
const [withTaskHooks, useTaskHooks] = ctx.hooks({
  list: useTaskList,
  selection: useTaskSelection,
});
```

Keep the hook map stable and unconditional. Each hook runs whenever its provider
component renders.

## Composition order

Compose wrappers according to their dependencies. In:

```tsx
const TaskPage = withProps(withModel(withHooks(RawTaskPage)));
```

`withProps` is outermost, followed by `withModel`, then `withHooks`. Hooks resolved
inside `withHooks` may consume props and model context because those providers are
already mounted.

Do not make an outer provider depend on a context provided by an inner wrapper.

## Component statics

Pass additional statics as the optional second argument:

```tsx
export const TaskPage = withTaskModel(RawTaskPage, {
  Header: TaskPageHeader,
  Actions: TaskPageActions,
});
```

The wrapper also copies enumerable statics already attached to the raw component.

## Migration

Change imports without changing the API:

```tsx
// Before
import { ctx } from '@sokutils/react';

// After
import { ctx } from '@sokutils/react-context';
```

Keep `@sokutils/react` only when the file still uses APIs that remain in that
package, such as `promisify`.

## Verification checklist

After a migration:

1. Search for remaining `ctx` imports from `@sokutils/react`.
2. Run the React Context package type check and build.
3. Build consuming applications.
4. Verify each consumer hook is rendered below its matching provider.
5. Confirm optional model keys have explicit initial values.
