import path from 'path';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { match } from 'ts-pattern';
import { get, set } from 'lodash-es';
import { either } from '../packages/pure/src';

const MODES = ['feat', 'fix'] as const;
type Mode = typeof MODES[number]

const envs = {
  mode: process.env.MODE as Mode,
};

const main = async (mode: Mode) => {
  const cwd = process.cwd();
  const packageJsonPath = path.resolve(cwd, 'package.json');
  const packageJson = await import(packageJsonPath).then(r => r.default);
  const packageName = get(packageJson, 'name');
  const [tryLatestVer, error] = either(() => execSync(`npm view ${packageName} version`, { stdio: 'ignore' })) ?? '';
  const finalLatestVerStr = error ? '1.0.0' : tryLatestVer?.toString() ?? '1.0.0';
  const [major, minor, patch] = finalLatestVerStr.split('.').map(x => +x);
  const finalVer = match(mode)
    .with('feat', () => [major, minor + 1, 0].join('.'))
    .with('fix', () => [major, minor, patch + 1].join('.'))
    .otherwise(() => [major, minor, patch].join('.'));

  set(packageJson, 'version', finalVer);
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

if (envs.mode && MODES.includes(envs.mode)) {
  main(envs.mode);
}
else {
  console.error('process.env.MODE should be one of `feat` or `fix`.');
}