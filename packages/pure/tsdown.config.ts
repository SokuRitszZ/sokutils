import { defineConfig, mergeConfig } from 'tsdown';
import commonLibConfig from '../../configs/tsdown-purelib.config.ts';

export default defineConfig(
  mergeConfig(commonLibConfig, {}),
);
