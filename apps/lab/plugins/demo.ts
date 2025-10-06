
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { set } from 'lodash-es';

import { Plugin } from 'vite';
import { w } from '@sokutils/react';

const consts = {
  path: resolve(__dirname, '../src/demos'),
  query: '?demo-origin',
  undefined_export: 'export default () => undefined',
};

export const tsxdemo = (): Plugin => {
  const template = readFileSync(resolve(__dirname, './demo-template.tsx')).toString();
  
  return {
    name: '@sokutils/vite-plugin-tsx-demo',
    enforce: 'pre',
    config: config => {
      set(config, 'resolve.alias.@demos', consts.path);
    },
    load: (id) => {
      if (id.endsWith(consts.query)) {
        const code = readFileSync(id.replace(consts.query, '')).toString().replace(consts.undefined_export, '');
        return code;
      }
      if (id.startsWith(consts.path) && /\.tsx$/.test(id)) {
        const resolvedId = id.replace(/\.tsx$/, '');
        const resolvedCode = template.replaceAll('__ORIGIN_DEMO_FILE__', resolvedId);
        return resolvedCode;
      }
    },
  };
};