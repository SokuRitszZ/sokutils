import { defineConfig } from 'tsdown';

export const TSDOWN_LIBRARY_CONFIG = defineConfig({
  cwd: process.cwd(),
  entry: 'src/index.ts',
  outDir: 'dist',
  format: 'esm',
  fixedExtension: false,
  clean: true,
  dts: true,
  minify: true,
  treeshake: true,
  target: 'esnext',
  deps: {
    skipNodeModulesBundle: true,
  },
});

export default TSDOWN_LIBRARY_CONFIG;
