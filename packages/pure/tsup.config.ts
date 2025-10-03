import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: 'esm',
  splitting: true,
  // sourcemap: true,
  clean: true,
  dts: true,
  treeshake: true,
  minify: true,
  external: ['react'],
});
