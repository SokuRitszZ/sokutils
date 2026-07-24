import { defineConfig, mergeConfig } from 'vitest/config';
import commonLibConfig from '../../configs/vitest.config.ts';

export default defineConfig(
  mergeConfig(commonLibConfig, {}),
);
