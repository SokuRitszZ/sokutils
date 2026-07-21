import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dryRun = process.env.STABLE_RELEASE_DRY_RUN === '1';
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
}).trim();
const branch = process.env.RELEASE_BRANCH ?? process.env.GITHUB_HEAD_REF ?? '';
const match = branch.match(/^release\/(.+)\/(\d+\.\d+\.\d+)$/);
if (!match) {
  throw new Error(`Release branch must match release/<package-path>/x.y.z, got ${branch}`);
}

const [, rawPackagePath, version] = match;
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
const packageName = packageJson.name;
if (!packageName) {
  throw new Error(`${packageJsonPath} is missing name`);
}
if (packageJson.version !== version) {
  throw new Error(`${packageName} version is ${packageJson.version}; expected ${version} from ${branch}`);
}

run('pnpm', ['--filter', packageName, 'build']);

if (hasPublishedVersion(version)) {
  console.log(`${packageName}@${version} is already published; skipping npm publish.`);
  tagStableRelease(version);
  process.exit(0);
}

const tarball = packPackage();
publishTarball(tarball);
tagStableRelease(version);
console.log(`Published ${packageName}@${version}`);

function hasPublishedVersion(targetVersion) {
  try {
    npmView([`${packageName}@${targetVersion}`, 'version'], undefined, { silent: true });
    return true;
  }
  catch {
    return false;
  }
}

function tagStableRelease(targetVersion) {
  const tag = `${packageName}@${targetVersion}`;
  if (tagExists(tag)) {
    console.log(`Tag ${tag} already exists; skipping git tag.`);
    return;
  }
  run('git', ['config', 'user.name', 'github-actions[bot]']);
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  run('git', ['tag', tag]);
  run('git', ['push', 'origin', tag]);
}

function tagExists(tag) {
  try {
    exec('git', ['rev-parse', '--verify', `refs/tags/${tag}`], { silent: true });
    return true;
  }
  catch {
    return false;
  }
}

function packPackage() {
  const packDir = mkdtempSync(path.join(os.tmpdir(), 'sokutils-stable-'));
  const output = run('pnpm', ['pack', '--pack-destination', packDir, '--json'], {
    cwd: packageDir,
  });
  return JSON.parse(output).filename;
}

function publishTarball(tarball) {
  run('npm', ['publish', tarball, '--tag', 'latest', '--access', 'public', '--provenance', '--ignore-scripts']);
}

function readPackageJson() {
  return JSON.parse(readFileSync(packageJsonPath, 'utf8'));
}

function npmView(args, fallback, options = {}) {
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

function run(command, args, options = {}) {
  console.log(`$ ${[command, ...args].join(' ')}`);
  if (dryRun && ['publish', 'push', 'tag'].some(commandName => args.includes(commandName))) {
    return '';
  }
  return exec(command, args, options);
}

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.silent ? 'ignore' : 'inherit'],
  });
}
