import { defineConfig, presetIcons, presetMini } from 'unocss';

const toTheme = (themes: string[]) => {
  return themes.reduce((acc, theme) => {
    acc[theme] = `var(--${theme})`;
    return acc;
  }, {} as Record<string, string>);
};

export default defineConfig({
  presets: [
    presetMini(),
    presetIcons(),
  ],
  shortcuts: {
    'tw-center': 'flex items-center justify-center',
  },
  theme: {
    colors: {
      ...toTheme(['primary', 'primary-foreground', 'secondary', 'muted', 'border', 'accent', 'destructive', 'background']),
    },
  },
});