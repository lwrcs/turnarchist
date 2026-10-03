// Read-only comparison of the staged game and its Windows package contents.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const electronDir = path.resolve(__dirname, '..');
const packageRoot = path.resolve(process.argv[2] || path.join(electronDir, 'dist', 'Turnarchist-win32-x64'));
const packagedApp = path.join(packageRoot, 'resources', 'app');

function files(root, prefix = '') {
  return fs.readdirSync(root, {withFileTypes: true}).flatMap(entry => {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) return files(path.join(root, entry.name), relative);
    assert.ok(entry.isFile(), `Unexpected package entry: ${relative}`);
    return [relative];
  }).sort();
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

assert.ok(fs.statSync(path.join(packageRoot, 'Turnarchist.exe')).size > 100_000_000);
const staged = path.join(electronDir, 'app');
const packaged = path.join(packagedApp, 'app');
const stagedFiles = files(staged);
assert.deepEqual(files(packaged), stagedFiles);
for (const relative of stagedFiles) {
  assert.equal(digest(path.join(staged, relative)), digest(path.join(packaged, relative)), relative);
}
for (const relative of ['main.js', 'preload.js']) {
  assert.equal(digest(path.join(electronDir, relative)), digest(path.join(packagedApp, relative)), relative);
}
console.log(`TURNARCHIST_WINDOWS_PACKAGE_OK ${JSON.stringify({packageRoot, stagedFiles: stagedFiles.length,
  bytesEqual: true, executableBytes: fs.statSync(path.join(packageRoot, 'Turnarchist.exe')).size})}`);
