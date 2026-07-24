# Promisify

`@sokutils/react-promisify` turns a mounted React component, such as a dialog or
drawer, into a typed Promise API.

The public API is available in two forms:

- `promisify.component(...)`
- `promisifyComponent(...)`

Both forms return the same tuple:

1. a Register component;
2. a hook for reading the active invocation and settling its Promise;
3. a function that opens the component and returns the Promise.

## Installation

```bash
pnpm add @sokutils/react-promisify
```

React is a peer dependency:

```bash
pnpm add react
```

## Quick start

```tsx
import { promisify } from '@sokutils/react-promisify';

interface ConfirmInput {
  message: string;
}

interface ConfirmConfig {
  title: string;
}

type ConfirmOutput = boolean;

const [ConfirmRegister, useConfirmTools, confirm] = promisify.component<
  ConfirmOutput,
  ConfirmInput,
  ConfirmConfig
>(() => {
  const {
    config,
    input,
    resolve,
    reject,
    visible,
  } = useConfirmTools();

  return (
    <Dialog open={visible}>
      <DialogTitle>{config.title}</DialogTitle>
      <DialogDescription>{input?.message}</DialogDescription>
      <button onClick={() => resolve(true)}>Confirm</button>
      <button onClick={() => resolve(false)}>Cancel</button>
      <button onClick={() => reject(new Error('closed'))}>Close</button>
    </Dialog>
  );
});

export const App = () => {
  const handleDelete = async () => {
    const confirmed = await confirm({
      message: 'Delete this item?',
    });

    if (confirmed) {
      await deleteItem();
    }
  };

  return (
    <>
      <ConfirmRegister title='Confirm action' />
      <button onClick={handleDelete}>Delete</button>
    </>
  );
};
```

## Generic parameters

`promisify.component` accepts four generic parameters:

```ts
promisify.component<Output, Input, Config, Error>(RawComponent);
```

- `Output`: value returned by the Promise after `resolve`.
- `Input`: value passed to the callable function.
- `Config`: props accepted by the Register component.
- `Error`: value accepted by `reject`.

Each parameter defaults to `void`.

## Register component

Mount the Register component before calling the Promise function:

```tsx
<ConfirmRegister title='Confirm action' />
```

Its props are the `Config` generic. The raw component supplied to
`promisify.component` receives no props directly; it reads invocation state using
the returned tools hook.

The Register component should remain mounted for as long as the callable function
may be used.

## Tools hook

The tools hook returns:

```ts
{
  config: Config;
  input: Input | undefined;
  visible: boolean;
  resolve: (output: Output) => void;
  reject: (error: Error) => void;
}
```

Calling `resolve` or `reject` settles the active Promise and sets `visible` to
`false`.

`input` is optional because the Register component may render before the first
invocation.

## Callable function

The third tuple item accepts `Input` and returns `Promise<Output>`:

```tsx
const result = await confirm({
  message: 'Continue?',
});
```

Calling it stores the input and sets `visible` to `true`.

## Placement and lifetime

Create the tuple at module scope:

```tsx
export const [ConfirmRegister, useConfirmTools, confirm] =
  promisify.component<Output, Input, Config, Error>(ConfirmDialog);
```

Do not create it during render. Each call creates a new isolated runtime context.

## Current concurrency boundary

One factory supports one pending invocation at a time. A second call before the
first Promise settles replaces the active input and settlement callbacks.

Use separate factories for independent dialogs, and serialize repeated calls when
they share one factory.

The callable function also requires its Register component to be mounted. Calling
it before registration cannot open the component.
