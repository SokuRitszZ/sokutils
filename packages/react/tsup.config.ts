import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  target: 'esnext',
  clean: true,
  // minify: true,
  dts: true,
  external: ['react', 'react-dom'],
  noExternal: ['lodash-es'],
});