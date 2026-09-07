const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const context = { exports: {}, require(name) {
    if (!(name in dependencies)) throw new Error(name);
    return dependencies[name];
  }};
  // No window, canvas, timers, or Date: effects must run without any of them.
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  return context.exports;
}

function beamFixture(callback = () => {}) {
  class BeamEffect {
    constructor() { this.points = Array.from({length: 30}, () => ({x: 0, y: 0})); }
    render() {}
  }
  const { SpellBeam } = load('src/projectile/spellBeam.ts', {
    '../game': {Game: {}}, './beamEffect': {BeamEffect},
    '../game/spellDiagnostics': {traceSpell() {}},
  });
  const player = {x: 0, y: 0, dead: false};
  const beam = new SpellBeam({}, player, 2, 2, callback);
  return { beam, player };
}

test('a spell arrives once and expires with no renderer or event loop', () => {
  let calls = 0;
  const {beam, player} = beamFixture(() => calls++);
  beam.advanceSimulation(14);
  assert.equal(calls, 0);
  assert.equal(player.busyAnimating, true);
  beam.advanceSimulation(1);
  assert.equal(calls, 1);
  assert.equal(player.busyAnimating, false);
  beam.advanceSimulation(15);
  assert.equal(beam.dead, true);
  beam.advanceSimulation(100);
  assert.equal(calls, 1);
});

test('drawing alone cannot cast a spell or release its action lock', () => {
  let calls = 0;
  const {beam, player} = beamFixture(() => calls++);
  for (let i = 0; i < 40; i++) { beam.draw(1); beam.drawTopLayer(1); }
  assert.equal(calls, 0);
  assert.equal(player.busyAnimating, true);
  beam.advanceSimulation(30);
  assert.equal(calls, 1);
  assert.equal(beam.dead, true);
});

test('dead casters release their lock without applying the spell', () => {
  let calls = 0;
  const {beam, player} = beamFixture(() => calls++);
  player.dead = true;
  beam.advanceSimulation(30);
  assert.equal(calls, 0);
  assert.equal(player.busyAnimating, false);
});

test('callback errors propagate and cannot cause a second cast', () => {
  let calls = 0;
  const {beam, player} = beamFixture(() => { calls++; throw new Error('cast failed'); });
  assert.throws(() => beam.advanceSimulation(15), /cast failed/);
  assert.equal(player.busyAnimating, false);
  beam.advanceSimulation(15);
  assert.equal(calls, 1);
});

test('invalid deltas cannot alter effect time', () => {
  const {beam} = beamFixture();
  for (const delta of [-1, NaN, Infinity]) {
    assert.throws(() => beam.advanceSimulation(delta), /Invalid simulation delta/);
  }
});

test('shared rooms advance once; new effects wait for the next frame; finished replay freezes', () => {
  const {advanceSimulationEffects} = load('src/game/simulationEffects.ts');
  const calls = [];
  const spawned = {advanceSimulation: delta => calls.push(['spawned', delta])};
  const room = {projectiles: [{advanceSimulation(delta) {
    calls.push(['original', delta]); room.projectiles.push(spawned);
  }}]};
  let finished = false;
  const game = {players: {a: {getRoom: () => room}, b: {getRoom: () => room}},
    replayManager: {isFinished: () => finished}};
  advanceSimulationEffects(game, 1);
  assert.deepEqual(calls, [['original', 1]]);
  advanceSimulationEffects(game, 2);
  assert.deepEqual(calls, [['original', 1], ['original', 2], ['spawned', 2]]);
  finished = true;
  advanceSimulationEffects(game, 3);
  assert.equal(calls.length, 3);
});
