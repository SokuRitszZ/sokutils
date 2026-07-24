# Promisify Coding Guide

Use this guide when building imperative React dialogs, drawers, or other layers
with `@sokutils/react-promisify`.

## Public API

```tsx
import {
  promisify,
  promisifyComponent,
} from '@sokutils/react-promisify';
```

Prefer the namespace form:

```tsx
promisify.component<Output, Input, Config, Error>(RawComponent);
```

## Naming

Name the returned tuple by product intent:

```tsx
export const [
  ConfirmRegister,
  useConfirmTools,
  confirm,
] = promisify.component<ConfirmOutput, ConfirmInput, ConfirmConfig, ConfirmError>(
  ConfirmDialog,
);
```

- Register component: `${Name}Register`
- tools hook: `use${Name}Tools`
- callable function: lower camel-case product action

## Placement

Create the factory at module scope. Do not create it inside a React component or
hook:

```tsx
const [TaskPickerRegister, useTaskPickerTools, pickTask] =
  promisify.component<Output, Input, Config>(TaskPickerDialog);
```

Mount the Register component once near the owning feature root:

```tsx
export const TaskPage = () => (
  <>
    <TaskPickerRegister title='Pick a task' />
    <TaskPageContent />
  </>
);
```

Descendants may call `pickTask` as long as the Register remains mounted.

## Raw component

The raw component receives no props. Read all invocation state from the tools
hook:

```tsx
const TaskPickerDialog = () => {
  const {
    config,
    input,
    resolve,
    reject,
    visible,
  } = useTaskPickerTools();

  return (
    <Dialog open={visible}>
      ...
    </Dialog>
  );
};
```

Use `input?` defensively because the Register can render before the first call.

## Settling

Call `resolve(output)` for a successful result and `reject(error)` for a rejected
operation. Both hide the registered component.

Ensure every user-controlled closing path settles the Promise. If clicking outside
or pressing Escape closes the underlying dialog without resolve/reject, the caller
will remain pending.

## Concurrency

One factory supports only one pending call. Do not call the same function again
before its previous Promise settles.

Use different factories for independent layers. Add an explicit queue before
extending the core implementation when repeated calls must be serialized.

## Migration

Change the import without changing the API:

```tsx
// Before
import { promisify } from '@sokutils/react';

// After
import { promisify } from '@sokutils/react-promisify';
```

The old `@sokutils/react` package is removed after React Context and Promisify are
independent.

## Verification checklist

1. Search for remaining imports from `@sokutils/react`.
2. Run the Promisify package type check and build.
3. Build consuming applications.
4. Confirm the Register component is mounted before any call.
5. Confirm every close path resolves or rejects the active Promise.
