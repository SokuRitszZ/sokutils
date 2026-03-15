# Div Utils Usage Examples

This document provides detailed usage examples and best practices for the Div Utils library.

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Configuration Types](#configuration-types)
3. [Real-world Scenarios](#real-world-scenarios)
4. [Advanced Techniques](#advanced-techniques)
5. [Common Questions](#common-questions)

## Basic Usage

### 1. Creating Button Components with divx

```typescript
import { divx, divVariants } from '@sokutils/react';

const Button = divx({
  disabled: ['bg-blue-500 hover:bg-blue-600', 'bg-gray-400 cursor-not-allowed'],
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
  loading: 'animate-spin',
}, 'rounded transition-colors');

// Usage examples
<Button variant="primary" size="md">Primary Button</Button>
<Button variant="danger" size="lg">Danger Large Button</Button>
<Button disabled>Disabled Button</Button>
<Button variant="warning" size="md">Warning (uses __default 'primary')</Button>
```

### 2. Creating Components with Different Tags Using divy

```typescript
import { divy } from '@sokutils/react';

const StyledButton = divy('button', {
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
  },
}, 'px-4 py-2 rounded');

const StyledInput = divy('input', {
  error: ['border-gray-300', 'border-red-500'],
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
  },
}, 'border rounded');

const StyledLink = divy('a', {
  active: ['text-gray-600', 'text-blue-600'],
}, 'hover:underline');

// Usage examples
<StyledButton variant="primary">Click me</StyledButton>
<StyledInput error={true} size="md" />
<StyledLink active={false}>Link</StyledLink>
```

### 3. Wrapping Custom Components with divz

```typescript
import { divz } from '@sokutils/react';

interface CustomCardProps {
  title: string;
  content: string;
  highlighted?: boolean;
}

const CustomCard = ({ title, content, highlighted }: CustomCardProps) => (
  <div className="p-4">
    <h3 className="font-bold">{title}</h3>
    <p>{content}</p>
  </div>
);

const StyledCard = divz(CustomCard, {
  highlighted: ['bg-white', 'bg-yellow-100 border-yellow-300'],
}, 'border rounded shadow-md');

// Usage examples
<StyledCard title="Card 1" content="Content 1" />
<StyledCard title="Card 2" content="Content 2" highlighted />
```

## Configuration Types

### Array Configuration - Boolean Toggle

Suitable for style switching based on boolean values, where the first array element corresponds to false and the second to true.

```typescript
const ToggleButton = divx({
  active: ['bg-gray-200 text-gray-800', 'bg-blue-500 text-white'],
  disabled: ['opacity-100 cursor-pointer', 'opacity-50 cursor-not-allowed'],
}, 'px-4 py-2 rounded');

// Usage
<ToggleButton active={false}>Inactive</ToggleButton>
<ToggleButton active={true}>Active</ToggleButton>
<ToggleButton disabled>Disabled</ToggleButton>
```

### Object Configuration - Multi-value Selection

Suitable for style selection based on string values, where keys are possible prop values and values are corresponding classNames.

```typescript
const StatusBadge = divx({
  status: {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  },
}, 'px-2 py-1 rounded text-sm font-medium');

// Usage
<StatusBadge status="success">Success</StatusBadge>
<StatusBadge status="error">Error</StatusBadge>
<StatusBadge status="warning">Warning</StatusBadge>
```

### Object Configuration with __default Fallback

Object configurations can include an optional `__default` key that specifies which variant to use as the default when the prop value doesn't match any defined key.

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
<Button variant="unknown" size="unknown">Both use __default</Button>
```

### Using divVariants Helper Function

The `divVariants` helper function provides a cleaner and type-safe way to create variant configurations with default values:

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

**Benefits of using `divVariants`:**
- **Type Safety**: TypeScript ensures the default value is one of the existing keys
- **Cleaner Syntax**: No need to manually add `__default` property
- **Better Maintainability**: Default value is clearly separated from the variants
- **IDE Support**: Better autocomplete and type hints

### String Configuration - Conditional Application

Suitable for applying specific styles when a prop is truthy.

```typescript
const IconButton = divx({
  loading: 'animate-spin',
  outlined: 'border-2 border-current',
  rounded: 'rounded-full',
}, 'p-2 hover:bg-gray-100');

// Usage
<IconButton loading>Refresh</IconButton>
<IconButton outlined>Cancel</IconButton>
<IconButton rounded>Close</IconButton>
<IconButton loading outlined rounded>Combined</IconButton>
```

## Real-world Scenarios

### Scenario 1: Form Input Components

```typescript
import { divx, divVariants } from '@sokutils/react';

const FormInput = divx({
  error: ['border-gray-300 focus:border-blue-500', 'border-red-500 focus:border-red-600'],
  size: divVariants({
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3',
  }, 'md'),
  disabled: ['bg-white', 'bg-gray-100 cursor-not-allowed'],
}, 'border rounded w-full transition-colors');

// Usage
<FormInput placeholder="Username" />
<FormInput placeholder="Password" error={true} size="md" />
<FormInput placeholder="Email" disabled />
<FormInput placeholder="Custom" size="xl" /> // Uses __default 'md'
```

### Scenario 2: Card Component Variants

```typescript
import { divx, divVariants } from '@sokutils/react';

const Card = divx({
  variant: divVariants({
    default: 'bg-white border-gray-200',
    primary: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    danger: 'bg-red-50 border-red-200',
  }, 'default'),
  elevation: divVariants({
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  }, 'md'),
  rounded: ['rounded-none', 'rounded-lg'],
}, 'border p-6');

// Usage
<Card variant="default" elevation="md">Default Card</Card>
<Card variant="primary" elevation="lg">Primary Card</Card>
<Card variant="success" elevation="sm" rounded>Success Card</Card>
<Card variant="warning" elevation="xl">Warning (uses __default for both)</Card>
```

### Scenario 3: Navigation Menu Items

```typescript
const MenuItem = divx({
  active: ['text-gray-600 hover:bg-gray-100', 'bg-blue-100 text-blue-700'],
  disabled: ['opacity-100 cursor-pointer', 'opacity-50 cursor-not-allowed'],
  level: {
    1: 'pl-4',
    2: 'pl-8',
    3: 'pl-12',
  },
}, 'px-4 py-2 rounded transition-colors');

// Usage
<MenuItem active level={1}>Dashboard</MenuItem>
<MenuItem level={1}>Settings</MenuItem>
<MenuItem level={2}>Profile</MenuItem>
<MenuItem level={3}>Change Password</MenuItem>
<MenuItem disabled>Disabled Item</MenuItem>
```

### Scenario 4: Loading State Buttons

```typescript
import { divx, divVariants } from '@sokutils/react';

const LoadingButton = divx({
  loading: ['opacity-100', 'opacity-70'],
  variant: divVariants({
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }, 'primary'),
  size: divVariants({
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  }, 'md'),
}, 'rounded transition-all disabled:cursor-not-allowed');

// Usage
<LoadingButton variant="primary" size="md">Submit</LoadingButton>
<LoadingButton variant="danger" size="lg" loading>Loading...</LoadingButton>
<LoadingButton variant="warning" size="md">Warning (uses __default 'primary')</LoadingButton>
<LoadingButton variant="primary" size="xl">Primary XL (uses __default 'md')</LoadingButton>
```

## Advanced Techniques

### 1. Combining Multiple Configurations

```typescript
const baseButtonConfig = {
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  },
  rounded: ['rounded-none', 'rounded-md'],
};

const PrimaryButton = divx({
  ...baseButtonConfig,
  variant: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  },
}, 'transition-colors');

const OutlineButton = divx({
  ...baseButtonConfig,
  outlined: 'border-2 border-current',
  variant: {
    primary: 'text-blue-500 hover:bg-blue-50',
    secondary: 'text-gray-600 hover:bg-gray-50',
  },
}, 'transition-colors');
```

### 2. Overriding Configuration with className Prop

```typescript
const CustomButton = divx({
  variant: {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
  },
}, 'px-4 py-2 rounded');

// Configured className will be overridden by className prop
<CustomButton variant="primary" className="bg-green-500">
  Green Button (overrides primary)
</CustomButton>
```

### 3. Responsive Design

```typescript
import { divx, divVariants } from '@sokutils/react';

const ResponsiveCard = divx({
  responsive: divVariants({
    mobile: 'w-full',
    tablet: 'w-1/2',
    desktop: 'w-1/3',
  }, 'mobile'),
}, 'p-4 border rounded');

// Use with media queries
<ResponsiveCard responsive="mobile">Mobile Card</ResponsiveCard>
<ResponsiveCard responsive="tablet">Tablet Card</ResponsiveCard>
<ResponsiveCard responsive="desktop">Desktop Card</ResponsiveCard>
<ResponsiveCard responsive="unknown">Unknown (uses __default 'mobile')</ResponsiveCard>
```

### 4. Dynamic Theming

```typescript
const ThemedComponent = divx({
  theme: {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-white',
    system: 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white',
  },
}, 'p-4 rounded');

// Usage
<ThemedComponent theme="light">Light Theme</ThemedComponent>
<ThemedComponent theme="dark">Dark Theme</ThemedComponent>
<ThemedComponent theme="system">System Theme</ThemedComponent>
```

### 5. Complex State Combinations

```typescript
const ComplexButton = divx({
  disabled: ['bg-blue-500 hover:bg-blue-600', 'bg-gray-400 cursor-not-allowed'],
  loading: ['opacity-100', 'opacity-70'],
  variant: {
    primary: 'text-white',
    secondary: 'text-gray-800',
  },
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  },
  outlined: ['border-none', 'border-2 border-current'],
}, 'rounded transition-all');

// Usage
<ComplexButton variant="primary" size="md">Primary Medium</ComplexButton>
<ComplexButton variant="secondary" size="lg" outlined>Secondary Large Outline</ComplexButton>
<ComplexButton variant="primary" size="sm" disabled loading>Primary Small Disabled Loading</ComplexButton>
```

### 6. Using __default for Robust Fallback Handling

The `__default` key provides a powerful way to handle unexpected prop values gracefully by specifying which variant to use as default:

```typescript
import { divx, divVariants } from '@sokutils/react';

const RobustButton = divx({
  variant: divVariants({
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }, 'primary'),
  size: divVariants({
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  }, 'md'),
}, 'rounded transition-all');

// Usage - all these will work correctly
<RobustButton variant="primary" size="md">Primary Medium</RobustButton>
<RobustButton variant="secondary" size="lg">Secondary Large</RobustButton>
<RobustButton variant="danger" size="sm">Danger Small</RobustButton>
<RobustButton variant="warning" size="md">Warning (uses __default 'primary')</RobustButton>
<RobustButton variant="primary" size="xl">Primary XL (uses __default 'md')</RobustButton>
<RobustButton variant="custom" size="custom">Both use __default</RobustButton>
```

This approach is especially useful when:
- Working with dynamic data that might contain unexpected values
- Building reusable components that need to handle edge cases
- Providing graceful degradation for unknown prop values
- Creating components that are more resilient to user input errors

### 7. Using divVariants for Cleaner Configuration

The `divVariants` helper function provides a cleaner and more type-safe way to create variant configurations:

```typescript
import { divx, divVariants } from '@sokutils/react';

// Without divVariants (manual __default)
const Button1 = divx({
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
    __default: 'primary',
  },
}, 'rounded');

// With divVariants (cleaner and type-safe)
const Button2 = divx({
  variant: divVariants({
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
  }, 'primary'),
}, 'rounded');
```

**Benefits of using `divVariants`:**
- **Type Safety**: TypeScript ensures the default value is one of the existing keys
- **Cleaner Syntax**: No need to manually add `__default` property
- **Better Maintainability**: Default value is clearly separated from variants
- **IDE Support**: Better autocomplete and type hints
- **Consistency**: Standardized way to handle defaults across your codebase

## Common Questions

### Q1: How to handle Tailwind CSS class name conflicts?

A: The library internally uses `tailwind-merge` to handle class name conflicts, which intelligently merges and removes conflicting class names.

```typescript
const Button = divx({
  active: ['bg-gray-200', 'bg-blue-500'],
}, 'bg-gray-200 px-4 py-2 rounded');

// When active={true}, bg-gray-200 will be overridden by bg-blue-500
<Button active={true}>Active Button</Button>
```

### Q2: How to add custom props?

A: Configuration object keys automatically become component props.

```typescript
const CustomComponent = divx({
  customProp: {
    value1: 'class-1',
    value2: 'class-2',
  },
}, 'base-classes');

// customProp will become a component prop
<CustomComponent customProp="value1" />
```

### Q3: How to handle ref?

A: All generated components support ref.

```typescript
const Input = divx({
  error: ['border-gray-300', 'border-red-500'],
}, 'border rounded px-3 py-2');

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  
  return <Input ref={inputRef} />;
}
```

### Q4: How to wrap third-party components?

A: Use `divz` to wrap any React component.

```typescript
import { Button as AntButton } from 'antd';

const StyledAntButton = divz(AntButton, {
  type: {
    primary: 'shadow-lg',
    default: 'shadow-sm',
  },
}, 'transition-shadow');

// Usage
<StyledAntButton type="primary">Primary Button</StyledAntButton>
```

### Q5: How to handle complex conditional logic?

A: You can combine multiple configuration types to implement complex conditional logic.

```typescript
const SmartButton = divx({
  disabled: ['bg-blue-500', 'bg-gray-400'],
  loading: 'animate-spin',
  variant: {
    primary: 'text-white',
    secondary: 'text-gray-800',
  },
  size: {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  },
}, 'px-4 py-2 rounded');

// Multiple conditions can take effect simultaneously
<SmartButton variant="primary" size="lg" disabled loading>
  Complex State Button
</SmartButton>
```

### Q6: How to use __default for fallback values?

A: The `__default` key in object configurations specifies which variant to use as the default when the prop value doesn't match any defined key. This is useful for handling unexpected or undefined values gracefully.

```typescript
const Button = divx({
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    __default: 'primary', // Use 'primary' variant as default
  },
  size: {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-4 py-2',
    __default: 'md', // Use 'md' size as default
  },
}, 'rounded');

// Usage
<Button variant="primary" size="md">Primary Medium</Button>
<Button variant="secondary" size="sm">Secondary Small</Button>
<Button variant="warning" size="md">Warning (uses __default 'primary')</Button>
<Button variant="primary" size="xl">Primary XL (uses __default 'md')</Button>
```

The `__default` key is especially useful when:
- Working with dynamic data that might contain unexpected values
- Building reusable components that need to handle edge cases
- Providing graceful degradation for unknown prop values
- Creating components that are more resilient to user input errors

### Q7: What is the divVariants helper function?

A: The `divVariants` helper function provides a cleaner and type-safe way to create variant configurations with default values.

```typescript
import { divx, divVariants } from '@sokutils/react';

// Without divVariants (manual __default)
const Button1 = divx({
  variant: {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
    __default: 'primary',
  },
}, 'rounded');

// With divVariants (cleaner and type-safe)
const Button2 = divx({
  variant: divVariants({
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-800',
    danger: 'bg-red-500 text-white',
  }, 'primary'),
}, 'rounded');
```

**Benefits of using `divVariants`:**
- **Type Safety**: TypeScript ensures that the default value is one of the existing keys
- **Cleaner Syntax**: No need to manually add the `__default` property
- **Better Maintainability**: Default value is clearly separated from the variants
- **IDE Support**: Better autocomplete and type hints
- **Consistency**: Standardized way to handle defaults across your codebase

## Best Practices

1. **Keep configurations simple**: Avoid overly complex configurations; split into multiple components when necessary
2. **Use meaningful prop names**: Configuration keys should clearly express their purpose
3. **Provide default values**: Provide reasonable default styles through `restClassNames`
4. **Type safety**: Fully leverage TypeScript's type inference
5. **Performance optimization**: Consider using React.memo for frequently rendered components

## Summary

Div Utils provides a declarative, type-safe way to manage React component styles and attributes. By properly using configuration objects, you can greatly simplify component style management and improve code maintainability.
