
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { path } from '@sokutils/pure';
import { set } from 'es-toolkit/compat';

import { Plugin } from 'vite';

const consts = {
  path: resolve(__dirname, '../src/demos'),
  query: '?demo-origin',
  code_query: '?demo-code-raw',
  code_start: '// demo-code:start',
  code_end: '// demo-code:end',
  undefined_export: 'export default () => undefined',
};

export const tsxdemo = (): Plugin => {
  const template = readFileSync(resolve(__dirname, './demo-template.tsx')).toString();
  
  return {
    name: '@sokutils/vite-plugin-tsx-demo',
    enforce: 'pre',
    config: config => {
      const P = path.str.preset.dot.typing<typeof config>();
      set(config, P.resolve.alias['@demos'].$, consts.path);
    },
    load: (id) => {
      if (id.endsWith(consts.code_query)) {
        const demoFile = id.replace(consts.code_query, '');
        const codeFile = demoFile.replace(/\.tsx$/, '.code.ts');
        const rawCode = readFileSync(existsSync(codeFile) ? codeFile : demoFile).toString();
        const start = rawCode.indexOf(consts.code_start);
        const end = rawCode.indexOf(consts.code_end);
        const code = start >= 0 && end > start
          ? rawCode.slice(start + consts.code_start.length, end).trim()
          : rawCode;
        return `export default ${JSON.stringify(code)}`;
      }
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
