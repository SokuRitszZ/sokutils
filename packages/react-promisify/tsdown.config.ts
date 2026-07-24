import { defineConfig, mergeConfig } from 'tsdown';
import commonReactConfig from '../../configs/tsdown-react.config.mts';

export default defineConfig(
  mergeConfig(commonReactConfig, {
    entry: 'src/index.tsx',
  }),
);
