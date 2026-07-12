import { defineConfig, mergeConfig } from 'tsdown';
import commonLibConfig from '../../configs/tsdown-purelib.config.mts';

export default defineConfig(
  mergeConfig(commonLibConfig, {}),
);
