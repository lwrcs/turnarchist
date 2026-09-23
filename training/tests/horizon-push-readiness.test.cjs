'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ts = require('typescript');
// Extract actual production methods; no renderer or requestAnimationFrame exists
// in this harness. A push must settle through the ordinary visual threshold.
function methods(file, className, names, globals = {}) {
  const source = ts.createSourceFile(file, fs.readFileSync(path.join(__dirname, '../..', file), 'utf8'), ts.ScriptTarget.Latest, true);
  const cls = source.statements.find(n => ts.isClassDeclaration(n) && n.name?.text === className);
  const members = names.map(name => {
    const member = cls.members.find(m => m.name?.getText(source) === name);
    assert.ok(member, name); return member.getText(source);
  }).join('\n');
  const code = ts.transpileModule(`class Harness { ${members} }`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText;
  return vm.runInNewContext(code + '\nHarness', { ...globals, performance, setTimeout });
}
const constants = { ENTITY_PUSH_DRAW_MOVE_SPEED_START: .9, ENTITY_PUSH_DRAW_MOVE_SPEED_END: .5, PUSH_VISUAL_INPUT_UNLOCK_PROGRESS: .9 };
const Entity = methods('src/entity/entity.ts', 'Entity', ['advanceMovementVisuals', 'getPushAnimProgress01', 'getPushEaseInDecayBase', 'updatePushAnimFlag', 'isPushAnimating'], { GameConstants: constants });
const Player = methods('src/player/player.ts', 'Player', ['advancePushMoveInputVisuals', 'updatePushMoveInputLock'], { GameConstants: constants });
function fixture() {
  const e = Object.assign(new Entity(), { drawX: 1, drawY: 0, pushAnimActive: true, pushAnimStartMag: 1, dead: false, x: 4, y: 3, health: 2 });
  e.doneMoving = () => Math.max(Math.abs(e.drawX), Math.abs(e.drawY)) < .01;
  const p = Object.assign(new Player(), { pushMoveInputLockActive: true, pushMoveInputLockEntities: [e] });
  return { e, p };
}
test('hidden push readiness releases with no rendering and preserves gameplay fields', async () => {
  const { e, p } = fixture(); let ticks = 0;
  const Agent = methods('src/game/agentEnvironment.ts', 'AgentEnvironment', ['settle'], { AGENT_SIMULATION_MODE: true });
  const agent = Object.assign(new Agent(), { timeoutMs: 1000, ready: () => !p.pushMoveInputLockActive,
    game: { localPlayerID: 'local', players: { local: p }, update: () => { ticks++; } } });
  await agent.settle();
  assert.ok(ticks > 1 && ticks < 50); assert.ok(e.getPushAnimProgress01() >= .9);
  assert.deepEqual([e.x, e.y, e.health], [4, 3, 2]);
});
test('visual pump neither bypasses the progress threshold nor advances unrelated entities', () => {
  const { e, p } = fixture(); p.advancePushMoveInputVisuals(0);
  assert.equal(p.pushMoveInputLockActive, true); assert.equal(e.drawX, 1);
  e.dead = true; p.advancePushMoveInputVisuals(1);
  assert.equal(p.pushMoveInputLockActive, false); assert.equal(e.drawX, 1);
});
test('already ready simulation does not advance visuals or a turn', async () => {
  const Agent = methods('src/game/agentEnvironment.ts', 'AgentEnvironment', ['settle'], { AGENT_SIMULATION_MODE: true });
  const agent = Object.assign(new Agent(), { timeoutMs: 100, ready: () => true, game: { update() { assert.fail('extra turn'); } } });
  await agent.settle();
});
test('last-enemy camera pan settles without RAF using the ordinary skip behavior', async () => {
  const Game = methods('src/game.ts', 'Game', ['skipCameraAnimation']);
  const game = Object.assign(new Game(), { cameraAnimation: { active: true }, cameraTargetX: 4, cameraTargetY: 5,
    players: {}, localPlayerID: 'local', update() {} });
  const Agent = methods('src/game/agentEnvironment.ts', 'AgentEnvironment', ['settle'], { AGENT_SIMULATION_MODE: true });
  const agent = Object.assign(new Agent(), { timeoutMs: 100, game, ready: () => !game.cameraAnimation.active });
  await agent.settle();
  assert.equal(game.cameraAnimation.active, false);
  assert.deepEqual([game.cameraX, game.cameraY], [4, 5]);
});
test('visible game does not skip its camera presentation', async () => {
  const Agent = methods('src/game/agentEnvironment.ts', 'AgentEnvironment', ['settle'], { AGENT_SIMULATION_MODE: false });
  const game = { skipCameraAnimation() { assert.fail('visible camera skipped'); }, update() { assert.fail('visible game pumped'); } };
  let checks = 0;
  await Object.assign(new Agent(), { timeoutMs: 100, game, ready: () => ++checks > 1 }).settle();
});
test('hidden ladder generation advances its presentation fade without waiting for RAF', async () => {
  const Agent = methods('src/game/agentEnvironment.ts', 'AgentEnvironment', ['settle'], { AGENT_SIMULATION_MODE: true });
  let generated = 0, ready = false;
  const game = { localPlayerID: 'local', players: { local: { advancePushMoveInputVisuals() {} } }, cameraAnimation: null,
    async completePreLevelGenFadeForSimulation() { generated++; ready = true; return true; }, update() {} };
  await Object.assign(new Agent(), { timeoutMs: 100, game, ready: () => ready }).settle();
  assert.equal(generated, 1);
});
test('hidden ladder transition enters its destination at the rendered dither threshold', () => {
  const LevelState = { TRANSITIONING_LADDER: 2 };
  const LevelConstants = { LEVEL_TRANSITION_TIME_LADDER: 1000 };
  const Game = methods('src/game.ts', 'Game', ['completeLadderTransitionForSimulation'], { LevelState, LevelConstants, Date });
  let entered = 0;
  const linkedRoom = { enterLevel(player) { assert.equal(player.id, 'local'); entered++; } };
  const game = Object.assign(new Game(), { levelState: LevelState.TRANSITIONING_LADDER,
    transitioningLadder: { linkedRoom }, transitionStartTime: Date.now() - 649,
    localPlayerID: 'local', players: { local: { id: 'local' } },
    setActiveRoom(room) { this.room = room; } });
  assert.equal(game.completeLadderTransitionForSimulation(), false);
  game.transitionStartTime = Date.now() - 650;
  assert.equal(game.completeLadderTransitionForSimulation(), true);
  assert.equal(entered, 1); assert.equal(game.transitioningLadder, null);
  assert.equal(game.completeLadderTransitionForSimulation(), false);
});
