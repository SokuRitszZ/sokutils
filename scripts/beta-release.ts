import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

interface ExecOptions {
  cwd?: string;
  silent?: boolean;
}

interface PackageJson {
  name?: string;
  version: string;
  [key: string]: unknown;
}

interface PackResult {
  filename: string;
}

const dryRun = process.env.BETA_RELEASE_DRY_RUN === '1';
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim();
const branch = process.env.GITHUB_REF_NAME ?? exec('git', ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
const match = branch.match(/^release\/(.+)\/(\d+\.\d+\.\d+)$/);
if (!match) {
  throw new Error(`Branch must match release/<package-path>/x.y.z, got ${branch}`);
}

const [, rawPackagePath, baseVersion] = match;
const packagePath = rawPackagePath.replace(/^packages\//, '');
if (packagePath.includes('..') || path.isAbsolute(packagePath)) {
  throw new Error(`Invalid package path in branch: ${rawPackagePath}`);
}

const packageDir = path.join(root, 'packages', packagePath);
const packageJsonPath = path.join(packageDir, 'package.json');
if (!existsSync(packageJsonPath)) {
  throw new Error(`No package.json found at ${packageJsonPath}`);
}

const packageJson = readPackageJson();
const rawPackageName = packageJson.name;
if (!rawPackageName) {
  throw new Error(`${packageJsonPath} is missing name`);
}
const packageName = rawPackageName;

setBaseVersion();
run('pnpm', ['--filter', packageName, 'build']);

const betaVersion = prepareBetaVersion();
const tarball = packPackage();
publishTarball(tarball);
tagBetaRelease(betaVersion);
console.log(`Published ${packageName}@${betaVersion}`);

function setBaseVersion(): void {
  if (packageJson.version === baseVersion) {
    return;
  }
  console.log('[beta-release]\n', 'base version: ', baseVersion, '\n', 'package json version: ', packageJson.version, '\n');
  packageJson.version = baseVersion;
  writePackageJson(packageJson);
  run('git', ['config', 'user.name', 'github-actions[bot]']);
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  run('git', ['add', packageJsonPath]);
  run('git', ['commit', '-m', `chore(${packagePath}): set release version ${baseVersion} [skip ci]`]);
  run('git', ['push']);
}

function prepareBetaVersion(): string {
  if (hasPublishedVersion(`${baseVersion}-beta.0`)) {
    const latestBeta = latestPublishedBeta();
    run('npm', ['version', latestBeta, '--no-git-tag-version'], { cwd: packageDir });
    run('npm', ['version', 'prerelease', '--no-git-tag-version'], { cwd: packageDir });
  }
  else {
    run('npm', ['version', `${baseVersion}-beta.0`, '--no-git-tag-version'], { cwd: packageDir });
  }
  return readPackageJson().version;
}

function latestPublishedBeta(): string {
  const versions = npmView([packageName, 'versions', '--json'], '[]');
  const parsed = JSON.parse(versions) as string[];
  const prefix = `${baseVersion}-beta.`;
  const betaVersions = parsed
    .filter(version => version.startsWith(prefix))
    .sort((left, right) => betaNumber(left) - betaNumber(right));
  const latestBeta = betaVersions.at(-1);
  if (!latestBeta) {
    throw new Error(`Expected ${packageName}@${baseVersion}-beta.0 to exist`);
  }

  return latestBeta;
}

function betaNumber(version: string): number {
  return Number(version.slice(`${baseVersion}-beta.`.length));
}

function hasPublishedVersion(version: string): boolean {
  try {
    npmView([`${packageName}@${version}`, 'version'], undefined, { silent: true });
    return true;
  }
  catch {
    return false;
  }
}

function tagBetaRelease(version: string): void {
  const tag = `${packageName}@${version}`;
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', tag]);
}

function packPackage(): string {
  const packDir = mkdtempSync(path.join(os.tmpdir(), 'sokutils-beta-'));
  const output = run('pnpm', ['pack', '--pack-destination', packDir, '--json'], {
    cwd: packageDir,
  });
  return (JSON.parse(output) as PackResult).filename;
}

function publishTarball(tarball: string): void {
  run('npm', ['publish', tarball, '--tag', 'beta', '--access', 'public', '--provenance', '--ignore-scripts']);
}

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJson;
}

function writePackageJson(value: PackageJson): void {
  writeFileSync(packageJsonPath, `${JSON.stringify(value, null, 2)}\n`);
}

function npmView(args: string[], fallback: string | undefined, options: ExecOptions = {}): string {
  try {
    return exec('npm', ['view', ...args], options).trim();
  }
  catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

function run(command: string, args: string[], options: ExecOptions = {}): string {
  console.log(`$ ${[command, ...args].join(' ')}`);
  if (dryRun && ['add', 'commit', 'push', 'publish', 'tag'].some(commandName => args.includes(commandName))) {
    return '';
  }
  return exec(command, args, options);
}

function exec(command: string, args: string[], options: ExecOptions = {}): string {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.silent ? 'ignore' : 'inherit'],
  });
}
