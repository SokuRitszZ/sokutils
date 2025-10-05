
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Plugin } from 'vite';

export const tsxdemo = (): Plugin => {
  const template = readFileSync(resolve(__dirname, './demo-template.tsx')).toString();
  
  return {
    name: '@sokutils/vite-plugin-tsx-demo',
    enforce: 'pre',
    transform: (_, id) => {
      if (!id.endsWith('?demo')) return ;
      const originFileId = id.replace(/\.tsx\?demo$/, '');
      const resolvedCode = template.replaceAll('__ORIGIN_DEMO_FILE__', originFileId);
      
      return { code: resolvedCode, map: null };
    },
  };
};