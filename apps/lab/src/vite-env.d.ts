/// <reference types="vite/client" />

declare module '@demos/**' {
  import type { ComponentType } from 'react';
  const Component: ComponentType;
  export default Component;
}
