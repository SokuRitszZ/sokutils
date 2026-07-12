import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    disableConsoleIntercept: true,
    include: ['src/**/*.test.ts', 'src/**/test.ts'],
  },
});
