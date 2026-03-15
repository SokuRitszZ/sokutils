# Div Utils

A powerful React component configuration utility library that dynamically generates and manages component className and attributes through configuration objects.

## Features

- 🎨 **Declarative Configuration**: Manage component styles through configuration objects
- 🔄 **Conditional Styles**: Support prop-based conditional style switching
- 🧩 **Type Safety**: Complete TypeScript type support
- 🎯 **Priority Control**: Flexible className merging priority
- 📦 **Component Wrapping**: Support wrapping any React component

## Installation

```bash
npm install @sokutils/react
```

## Core Concepts

### StandardDivConfig

Configuration object type supporting three configuration methods:

```typescript
type StandardDivConfig = {
  [K in string]: [string, string] | StandardDivConigVariant | string;
}

type StandardDivConigVariant = Record<string, string> & { __default?: string }
```

1. **Array Form**: `[falseValue, trueValue]` - Select based on prop boolean value
2. **Object Form**: `{ key: className }` - Select based on prop string value
3. **String Form**: `className` - Apply when prop is truthy
4. **Default Value**: Object configurations can include an optional `__default` key that specifies which variant to use as the default when the prop value doesn't match any key

## API

### divx

Convenience function for quickly creating `div` elements.

```typescript
divx<C extends StandardDivConfig>(config: C, ...restClassNames: string[])
```

**Parameters:**
- `config`: Configuration object
- `restClassNames`: Default className

**Returns:** React component

### divy

Generic function for creating any HTML tag element.

```typescript
divy<T extends HTMLTag, C extends StandardDivConfig>(
  tag: T,
  config: C,
  ...restClassNames: string[]
)
```

**Parameters:**
- `tag`: HTML tag name (e.g., 'div', 'button', 'span')
- `config`: Configuration object
- `restClassNames`: Default className

**Returns:** React component

### divz

Wrap any React component and add configuration functionality.

```typescript
divz<TComponent extends ComponentType<any>, C extends StandardDivConfig>(
  Component: TComponent,
  config: C,
  ...restClassNames: string[]
)
```

**Parameters:**
- `Component`: React component to wrap
- `config`: Configuration object
- `restClassNames`: Default className

**Returns:** Wrapped React component

### mergeClassName

Utility function for merging className.

```typescript
mergeClassName({
  config: StandardDivConfig;
  props: Obj;
  restClassNames: string[];
  propClassName?: string;
})
```

**Priority (from high to low):**
1. `propClassName` - className prop passed directly
2. `config` - className resolved from config based on props
3. `restClassNames` - Default className

### divVariants

Helper function for creating variant configuration objects with a default value.

```typescript
divVariants<T extends Obj>(obj: T, __default: keyof T): T
```

**Parameters:**
- `obj`: Variant object containing key-value pairs
- `__default`: Key to use as default variant

**Returns:** Variant object with `__default` property added

**Example:**

```typescript
const variants = divVariants({
  primary: 'bg-blue-500 text-white',
  secondary: 'bg-gray-200 text-gray-800',
  danger: 'bg-red-500 text-white',
}, 'primary');

// Result: {
//   primary: 'bg-blue-500 text-white',
//   secondary: 'bg-gray-200 text-gray-800',
//   danger: 'bg-red-500 text-white',
//   __default: 'primary'
// }
```

## Usage Examples

### Basic Usage - divx

```typescript
import { divx } from '@sokutils/react';

const Button = divx({
  disabled: ['bg-blue-500', 'bg-gray-400'],
  size: {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  },
  loading: 'animate-spin',
}, 'px-4 py-2 rounded');

// Usage
<Button>Click me</Button>
<Button disabled>Disabled</Button>
<Button size="lg">Large</Button>
<Button loading>Loading...</Button>
```

### Generic Tags - divy

```typescript
import { divy } from '@sokutils/react';

const StyledButton = divy('button', {
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
  },
}, 'px-4 py-2 rounded');

const StyledInput = divy('input', {
  error: ['border-gray-300', 'border-red-500'],
}, 'border rounded px-3 py-2');
```

### Component Wrapping - divz

```typescript
import { divz } from '@sokutils/react';

interface CustomInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const CustomInput = ({ value, onChange, label }: CustomInputProps) => (
  <div>
    {label && <label>{label}</label>}
    <input value={value} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const StyledInput = divz(CustomInput, {
  label: 'font-bold text-gray-700',
  value: {
    empty: 'border-gray-300',
    filled: 'border-blue-500',
  },
}, 'w-full');

// Usage
<StyledInput value="" onChange={() => {}} />
<StyledInput value="filled" onChange={() => {}} label="Username" />
```

### Complex Configuration Example

```typescript
const ComplexButton = divx({
  // Array form: switch based on boolean value
  disabled: ['bg-blue-500 hover:bg-blue-600', 'bg-gray-400 cursor-not-allowed'],
  
  // Object form: select based on string value
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
    success: 'bg-green-500 text-white',
  },
  
  // String form: apply when prop is truthy
  loading: 'animate-spin',
  outline: 'border-2 border-current',
  
  // Nested object
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  },
}, 'rounded transition-colors');

// Usage
<ComplexButton variant="primary" size="md">Primary Button</ComplexButton>
<ComplexButton variant="danger" disabled>Danger Disabled</ComplexButton>
<ComplexButton variant="success" size="lg" outline>Success Outline</ComplexButton>
```

### Using __default for Fallback Values

The `__default` key in object configurations specifies which variant to use as the default when the prop value doesn't match any defined key:

```typescript
const Button = divx({
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
    __default: 'primary', // Use 'primary' variant as default
  },
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
    __default: 'md', // Use 'md' size as default
  },
}, 'rounded transition-colors');

// Usage
<Button variant="primary" size="md">Primary Medium</Button>
<Button variant="secondary" size="lg">Secondary Large</Button>
<Button variant="danger" size="sm">Danger Small</Button>
<Button variant="warning" size="md">Warning (uses __default 'primary')</Button>
<Button variant="primary" size="xl">Primary XL (uses __default 'md')</Button>
```

### Using divVariants Helper Function

The `divVariants` helper function provides a cleaner way to create variant configurations with default values:

```typescript
import { divx, divVariants } from '@sokutils/react';

const Button = divx({
  variant: divVariants({
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
  }, 'primary'),
  size: divVariants({
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  }, 'md'),
}, 'rounded transition-colors');

// Usage - same as above
<Button variant="primary" size="md">Primary Medium</Button>
<Button variant="warning" size="md">Warning (uses __default 'primary')</Button>
```

This approach provides better type safety and cleaner syntax when working with variant configurations.

## Type Definitions

### HTMLTag

```typescript
type HTMLTag = keyof HTMLElementTagNameMap;
```

Union type of all HTML tag names.

### StandardDivConfig

```typescript
type StandardDivConfig = {
  [K in string]: [string, string] | StandardDivConigVariant | string;
}
```

Type definition for configuration objects.

### StandardDivConigVariant

```typescript
type StandardDivConigVariant = Record<string, string> & { __default?: string }
```

Extended object type for variant configurations. The `__default` key specifies which variant to use as the default when the prop value doesn't match any defined key. It should be one of the existing keys in the object.

### ConvertConfigToProps

```typescript
type ConvertConfigToProps<C extends StandardDivConfig> = {
  [K in keyof C]?: C[K] extends Record<string, string>
    ? Exclude<keyof C[K], '__default'> : any;
}
```

Utility type to convert configuration objects to props types. The `__default` key is excluded from the generated prop types since it's used internally.

## Notes

1. **Priority**: `propClassName` > `config` > `restClassNames`
2. **Type Safety**: Configuration object keys automatically become component prop types
3. **Tailwind CSS**: Recommended to use with `tailwind-merge` to avoid style conflicts
4. **Performance**: Components use `forwardRef` and `React.memo` for performance optimization

## License

MIT
