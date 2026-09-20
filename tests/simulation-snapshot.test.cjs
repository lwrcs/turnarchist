const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(dependencies) {
  const context = {exports: {}, require(name) {
    if (!(name in dependencies)) throw new Error(`Missing dependency: ${name}`);
    return dependencies[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/game/save/simulationSnapshot.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports;
}

function setup({mutate = false, rng = 99} = {}) {
  const game = {rng, value: 7};
  const api = load({
    '../../game': {},
    './fingerprint': {captureFingerprint(current) { return {rngState: current.rng, value: current.value}; }},
    './writeV2': {createSaveV2(current) {
      if (mutate) current.value++;
      return {ok: true, value: {saveVersion: 2, worldSpec: {rngState: current.rng}}};
    }},
    './validate': {parseSaveV2Json(raw) { return {ok: true, value: JSON.parse(raw)}; }},
  });
  return {game, api};
}

test('a simulation snapshot is JSON-safe and leaves its source game unchanged', () => {
  const {game, api} = setup();
  const result = api.createSimulationSnapshot(game);
  assert.equal(result.ok, true);
  assert.equal(result.value.save.worldSpec.rngState, 99);
  assert.equal(JSON.parse(result.value.serialized).saveVersion, 2);
  assert.equal(api.isLiveGameUnchanged(game, result.value), true);
});

test('snapshot creation rejects a serializer that changes live state', () => {
  const {game, api} = setup({mutate: true});
  const result = api.createSimulationSnapshot(game);
  assert.equal(result.ok, false);
  assert.match(result.error, /mutated the live game/);
});

test('snapshot detects later mutation of the visible game', () => {
  const {game, api} = setup();
  const result = api.createSimulationSnapshot(game);
  game.value++;
  assert.equal(api.isLiveGameUnchanged(game, result.value), false);
});

test('snapshot rejects an RNG state that does not describe the current game', () => {
  const game = {rng: 9, value: 1};
  const api = load({
    '../../game': {},
    './fingerprint': {captureFingerprint(current) { return {rngState: current.rng, value: current.value}; }},
    './writeV2': {createSaveV2() { return {ok: true, value: {saveVersion: 2, worldSpec: {rngState: 8}}}; }},
    './validate': {parseSaveV2Json(raw) { return {ok: true, value: JSON.parse(raw)}; }},
  });
  const result = api.createSimulationSnapshot(game);
  assert.equal(result.ok, false);
  assert.match(result.error, /RNG/);
});
