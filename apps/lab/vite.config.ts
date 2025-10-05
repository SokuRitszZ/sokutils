import path from 'path';
import { defineConfig } from 'vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import uno from 'unocss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { tsxdemo } from './plugins/demo';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      'demo-card': path.resolve(__dirname, './src/components/demo-card'),
    },
  },
  plugins: [
    tsxdemo(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    uno(),
    viteStaticCopy({ targets: [{ src: './_redirects', dest: '' }] }),
  ],
});
