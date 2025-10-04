import { defineConfig, presetIcons, presetMini } from 'unocss';

export default defineConfig({
  presets: [
    presetMini(),
    presetIcons(),
  ],
  shortcuts: {
    'tw-center': 'flex items-center justify-center',
  },
});