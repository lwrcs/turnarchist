#!/usr/bin/env node
// Build a fresh, self-contained web artifact without writing into the checkout's dist/.
// Usage: node scripts/stage-web-release.cjs --out <new-directory> [--allow-dirty]
//        node scripts/stage-web-release.cjs --verify <staged-directory>

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifestName = 'release-manifest.json';
const required = ['index.html', 'play.html', 'style.css', 'service-worker.js',
  'manifest.webmanifest', 'dist/bundle.js'];

function sha(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function git(...args) {
  return execFileSync('git', args, {cwd: root});
}

function normalized(relative) {
  return relative.split(path.sep).join('/');
}

function walk(directory, prefix = '') {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Symlink in staged artifact: ${relative}`);
    if (entry.isDirectory()) return walk(path.join(directory, entry.name), relative);
    if (!entry.isFile()) throw new Error(`Unexpected staged entry: ${relative}`);
    return [relative];
  }).sort();
}

function fileRecord(directory, relative) {
  const bytes = fs.readFileSync(path.join(directory, ...relative.split('/')));
  return {path: relative, bytes: bytes.length, sha256: sha(bytes)};
}

function isWebFile(relative) {
  if (/^(res|help|wiki)\//.test(relative)) return true;
  if (relative.includes('/')) return false;
  if (/\.(html|js|css)$/.test(relative)) return true;
  if (/^apple.touch.icon.*\.png$/.test(relative)) return true;
  return ['CNAME', '_config.yml', 'manifest.webmanifest', 'teaching-seeds.json'].includes(relative);
}

function sourceIdentity() {
  const changed = git('diff', '--name-only', '-z', 'HEAD').toString('utf8')
    .split('\0').filter(Boolean).map(normalized).sort();
  const untrackedFiles = git('ls-files', '--others', '--exclude-standard', '-z')
    .toString('utf8').split('\0').filter(Boolean).map(normalized).sort()
    .map(relative => fileRecord(root, relative));
  const diff = git('diff', 'HEAD', '--binary');
  return {
    commit: git('rev-parse', 'HEAD').toString('utf8').trim(),
    dirty: changed.length > 0 || untrackedFiles.length > 0,
    changedPaths: changed,
    trackedDiffSha256: sha(diff),
    untrackedFiles,
  };
}

function verify(directory) {
  const manifestPath = path.join(directory, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.format !== 'turnarchist-web-release-v1') throw new Error('Unknown manifest format');
  const actualPaths = walk(directory).filter(relative => relative !== manifestName);
  const listedPaths = manifest.files.map(record => record.path);
  if (JSON.stringify(actualPaths) !== JSON.stringify(listedPaths)) {
    throw new Error('Staged file list differs from release manifest');
  }
  for (const expected of manifest.files) {
    const actual = fileRecord(directory, expected.path);
    if (actual.bytes !== expected.bytes || actual.sha256 !== expected.sha256) {
      throw new Error(`Staged file differs from release manifest: ${expected.path}`);
    }
  }
  for (const relative of required) {
    if (!listedPaths.includes(relative)) throw new Error(`Missing required web file: ${relative}`);
  }
  if (manifest.filesSha256 !== sha(JSON.stringify(manifest.files))) {
    throw new Error('Manifest file table checksum differs');
  }
  console.log(`Verified ${manifest.files.length} staged files at ${directory}`);
  return manifest;
}

function build(destination) {
  return new Promise((resolve, reject) => {
    const webpack = require('webpack');
    const config = require(path.join(root, 'webpack.config.js'));
    webpack({...config, mode: 'production', output: {
      ...config.output, path: path.join(destination, 'dist'),
    }}, (error, stats) => {
      if (error) return reject(error);
      if (!stats || stats.hasErrors()) {
        return reject(new Error(stats?.toString({all: false, errors: true}) || 'Webpack failed'));
      }
      if (stats.hasWarnings()) console.warn(stats.toString({all: false, warnings: true}));
      resolve();
    });
  });
}

async function stage(directory, allowDirty) {
  const resolved = path.resolve(directory);
  if (resolved === root || resolved.startsWith(root + path.sep)) {
    throw new Error('Stage outside the source checkout');
  }
  if (fs.existsSync(resolved)) throw new Error('Stage directory must be new');
  const source = sourceIdentity();
  if (source.dirty && !allowDirty) {
    throw new Error('Source checkout is dirty; commit changes or pass --allow-dirty for a diagnostic artifact');
  }
  const tracked = git('ls-files', '-z').toString('utf8').split('\0').filter(Boolean)
    .map(normalized).filter(isWebFile).sort();
  fs.mkdirSync(resolved, {recursive: true});
  for (const relative of tracked) {
    const from = path.join(root, ...relative.split('/'));
    const to = path.join(resolved, ...relative.split('/'));
    if (!fs.statSync(from).isFile()) throw new Error(`Not a regular web file: ${relative}`);
    fs.mkdirSync(path.dirname(to), {recursive: true});
    fs.copyFileSync(from, to);
  }
  await build(resolved);
  const files = walk(resolved).map(relative => fileRecord(resolved, relative));
  const manifest = {
    format: 'turnarchist-web-release-v1',
    createdAt: new Date().toISOString(),
    version: require(path.join(root, 'package.json')).version,
    source,
    build: {
      node: process.version,
      typescript: require(path.join(root, 'node_modules/typescript/package.json')).version,
      inputs: ['package.json', 'package-lock.json', 'webpack.config.js',
        'src/game/gameConstants.ts', 'src/game/gameplaySettings.ts'].map(relative => fileRecord(root, relative)),
    },
    files,
    filesSha256: sha(JSON.stringify(files)),
    unbundledScripts: files.filter(record => !record.path.includes('/') && record.path.endsWith('.js')),
    authoredMaps: files.filter(record => record.path === 'res/level.png' || record.path.startsWith('res/levels/')),
  };
  fs.writeFileSync(path.join(resolved, manifestName), JSON.stringify(manifest, null, 2) + '\n');
  verify(resolved);
  console.log(`Staged Turnarchist ${manifest.version} from ${source.commit}${source.dirty ? ' (dirty)' : ''}`);
}

const [mode, value, extra] = process.argv.slice(2);
if ((mode !== '--out' && mode !== '--verify') || !value ||
    (mode === '--verify' && extra) || (mode === '--out' && extra && extra !== '--allow-dirty')) {
  console.error('Usage: stage-web-release.cjs --out <new-directory> [--allow-dirty] | --verify <directory>');
  process.exitCode = 2;
} else if (mode === '--verify') {
  try { verify(path.resolve(value)); } catch (error) { console.error(error.message); process.exitCode = 1; }
} else {
  stage(value, extra === '--allow-dirty').catch(error => { console.error(error); process.exitCode = 1; });
}
