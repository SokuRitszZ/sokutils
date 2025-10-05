/// <reference types="vite/client" />

declare module '*?demo' {
  import type { ComponentType } from 'react';
  const Component: ComponentType;
  export default Component;
}