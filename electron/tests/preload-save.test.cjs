const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'preload.js'), 'utf8');

function fixture(overrides = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'turnarchist-save-check-'));
  fs.mkdirSync(path.join(root, 'saves'));
  let bridge;
  const fakeFs = {...fs, ...overrides};
  vm.runInNewContext(source, {
    require(name) {
      if (name === 'electron') return {contextBridge: {exposeInMainWorld(_name, value) { bridge = value; }}};
      if (name === 'fs') return fakeFs;
      return require(name);
    },
    process: {env: {ELECTRON_USERDATA: root}},
    console,
  }, {filename: 'preload.js'});
  return {root, bridge, close() {
    const resolved = path.resolve(root);
    assert.ok(resolved.startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(resolved, {recursive: true, force: true});
  }};
}

test('save names cannot escape the saves directory', () => {
  const f = fixture();
  try {
    for (const name of ['../outside', '..\\outside', '/outside', 'a/b', 'a\\b', '.', '', 'x'.repeat(100)]) {
      assert.throws(() => f.bridge.write(name, '{}'), {name: 'TypeError'});
      assert.throws(() => f.bridge.read(name), {name: 'TypeError'});
      assert.throws(() => f.bridge.exists(name), {name: 'TypeError'});
      assert.throws(() => f.bridge.remove(name), {name: 'TypeError'});
    }
    assert.deepEqual(fs.readdirSync(f.root), ['saves']);
  } finally { f.close(); }
});

test('interrupted replacement preserves the previous save and removes its temporary file', () => {
  const f = fixture({renameSync() { throw new Error('simulated rename failure'); }});
  try {
    fs.writeFileSync(path.join(f.root, 'saves', 'autosave.json'), '{"old":true}');
    assert.throws(() => f.bridge.write('autosave', '{"new":true}'), /simulated rename failure/);
    assert.equal(f.bridge.read('autosave'), '{"old":true}');
    assert.deepEqual(fs.readdirSync(path.join(f.root, 'saves')), ['autosave.json']);
    fs.writeFileSync(path.join(f.root, 'saves', '.autosave.interrupted.tmp'), 'partial');
    assert.equal(f.bridge.read('autosave'), '{"old":true}');
  } finally { f.close(); }
});

test('successful save is readable and removable', () => {
  const f = fixture();
  try {
    f.bridge.write('autosave', '{"turn":2}');
    assert.equal(f.bridge.read('autosave'), '{"turn":2}');
    f.bridge.write('autosave', '{"turn":3}');
    assert.equal(f.bridge.read('autosave'), '{"turn":3}');
    assert.equal(f.bridge.exists('autosave'), true);
    f.bridge.remove('autosave');
    assert.equal(f.bridge.exists('autosave'), false);
  } finally { f.close(); }
});
