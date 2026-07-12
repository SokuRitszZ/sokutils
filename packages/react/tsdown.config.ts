import { defineConfig, mergeConfig } from 'tsdown';
import commonLibConfig from '../../configs/tsdown-purelib.config.mts';

export default defineConfig(
  mergeConfig(commonLibConfig, {
    minify: false,
    deps: {
      skipNodeModulesBundle: false,
      neverBundle: ['react', 'react-dom'],
      alwaysBundle: [/^es-toolkit(?:\/|$)/],
      onlyBundle: [/^es-toolkit(?:\/|$)/],
    },
  }),
);
