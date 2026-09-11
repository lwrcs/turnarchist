const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');


function loadReadiness() {
  const context = {exports: {}, require: () => ({LevelState: {IN_LEVEL: 1}})};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/game/actionReadiness.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS}
  }).outputText, context);
  return context.exports;
}

function setup() {
  const timers = new Map();
  let timerId = 0;
  const settings = { REPLAY_SPEED: 'fast' };
  const context = {
    exports: {}, console: { log() {}, warn() {} }, Date,
    window: {
      setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
      clearTimeout(id) { timers.delete(id); },
    },
    require(name) {
      if (name === './spellDiagnostics') return {getSpellDiagnostics: () => []};
      if (name === './actionReadiness') return loadReadiness();
      if (name === '../game') return { LevelState: { IN_LEVEL: 1 } };
      if (name === './gameplaySettings') return { GameplaySettings: settings };
      if (name === './gameConstants') return { GameConstants: { MOVEMENT_COOLDOWN: 50, REPLAY_STEP_MS_FAST: 55 } };
      throw new Error(name);
    },
  };
  const source = fs.readFileSync('src/game/replayManager.ts', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, context);
  const manager = new context.exports.ReplayManager();
  manager.beginRecording(123);
  manager.recordAction({ type: 'Wait' });
  let processed = 0;
  const game = {
    levelState: 1, localPlayerID: 'local', players: {}, pushMessage() {},
    newGame(seed) { manager.beginRecording(seed); },
  };
  function addPlayer() {
    game.players.local = {
      x: 0, y: 0, menu: {}, inventory: { close() {} },
      actionProcessor: { process() { processed++; } },
    };
  }
  function next() {
    const [id, fn] = timers.entries().next().value;
    timers.delete(id);
    fn();
  }
  return { context, manager, game, timers, next, addPlayer, processed: () => processed };
}

test('pause blocks recorded actions until resumed', () => {
  const s = setup(); s.addPlayer(); s.manager.replay(s.game);
  s.manager.pause(); s.next();
  assert.equal(s.processed(), 0);
  s.manager.resume(); s.next();
  assert.equal(s.processed(), 1);
  s.next();
  assert.equal(s.manager.isFinished(), true);
  assert.equal(s.manager.isRecording(), false);
});

test('cancel clears the missing-player startup retry', () => {
  const s = setup(); s.manager.replay(s.game); s.next();
  assert.equal(s.timers.size, 1);
  s.manager.cancelReplay(); s.addPlayer();
  assert.equal(s.timers.size, 0);
  assert.equal(s.processed(), 0);
});

for (const reset of ['clearRecording', 'beginRecording', 'restore']) {
  test(`${reset} clears a scheduled replay action`, () => {
    const s = setup(); s.addPlayer(); s.manager.replay(s.game); s.next();
    const saved = s.manager.serialize();
    if (reset === 'restore') s.manager.restore(saved);
    else s.manager[reset](123);
    assert.equal(s.timers.size, 0);
    assert.equal(s.manager.isReplaying(), false);
  });
}

test('replay slow speed is independent of the expiring weapon effect', () => {
  const source = fs.readFileSync('src/player/playerRenderer.ts', 'utf8');
  const methods = source.slice(source.indexOf('  enableSlowMotion ='), source.indexOf('  getJumpOffset ='));
  const settings = { REPLAY_SPEED: 'slow' };
  const context = { GameplaySettings: settings };
  vm.runInNewContext(`class Motion { ${methods} }; renderer = new Motion();`, context);
  const renderer = context.renderer;
  let replaying = true;
  Object.assign(renderer, {
    player: { game: { replayManager: { isReplaying: () => replaying } } },
    motionSpeed: 1, slowMotionEnabled: true, slowMotionOverride: false,
    slowMotionTickDuration: 0,
  });
  renderer.updateSlowMotion();
  assert.equal(renderer.slowMotionEnabled, false, 'weapon effect still expires');
  renderer.enableSlowMotion();
  assert.equal(renderer.motionSpeed, 0.95, 'replay remains slow independently');
  replaying = false;
  renderer.enableSlowMotion();
  assert.equal(renderer.motionSpeed, 1, 'ending replay restores normal motion');
  settings.REPLAY_SPEED = 'fast';
  renderer.slowMotionEnabled = true;
  renderer.enableSlowMotion();
  assert.equal(renderer.motionSpeed, 0.95, 'weapon effect still works outside replay');
});


test('a mismatch publishes evidence without killing the player', () => {
  const s = setup();
  s.manager.restore({seed: 123, startMs: 0, recording: false, actions: [
    {t: 0, action: {type: 'Wait'}, outcome: {playerX: 1, playerY: 0}}
  ]});
  s.addPlayer(); s.game.players.local.health = 5;
  s.manager.replay(s.game); s.next();
  const report = s.context.window.lastReplayReport;
  assert.equal(report.status, 'failed');
  assert.equal(report.haltedAtStep, 1);
  const count = s.manager.getStats().count;
  s.manager.resume();
  s.manager.recordAction({type: "Wait"});
  assert.equal(s.manager.isFinished(), true);
  assert.equal(s.manager.isReplaying(), true);
  assert.equal(s.manager.isPaused(), true);
  assert.equal(s.manager.isRecording(), false);
  assert.equal(s.manager.getStats().count, count);
  assert.equal(report.recentSteps[0].before.health, 5);
  assert.equal(report.divergences[0].actualOutcome.playerX, 0);
  assert.equal(s.game.players.local.health, 5);
  assert.notEqual(s.game.players.local.dead, true);
});

test('an action exception ends playback with a report', () => {
  const s = setup(); s.addPlayer();
  s.game.players.local.actionProcessor.process = () => { throw new Error('fixture failure'); };
  s.manager.replay(s.game); s.next();
  assert.equal(s.manager.isFinished(), true);
  assert.match(s.context.window.lastReplayReport.failureReason, /fixture failure/);
});

test('diagnostic DOM mirrors reports and retains them across reloads', () => {
  const storage = new Map();
  const source = fs.readFileSync('replay-diagnostics.js', 'utf8');
  function load() {
    const context = { window: {}, document: {
      createElement: () => ({}), body: {appendChild(element) { if (element.id === "replay-diagnostics") context.element = element; else context.saveElement = element; }},
    }, sessionStorage: {getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v)} };
    vm.runInNewContext(source, context);
    return context;
  }
  const first = load();
  const report = {status: 'failed', haltedAtStep: 62, reason: '<script>fixture</script>'};
  first.window.publishReplayReport(report);
  assert.deepEqual(JSON.parse(first.element.textContent).report, report);
  assert.deepEqual(JSON.parse(load().element.textContent).report, report);
  first.window.publishSaveDiagnostic({event: "save-encoded", inventory: [{slot: 5, type: "Spellbook"}]});
  const reloaded = load();
  assert.equal(JSON.parse(reloaded.saveElement.textContent).events[0].inventory[0].type, "Spellbook");
  reloaded.window.publishSaveDiagnostic({event: "load-after"});
  assert.equal(JSON.parse(reloaded.saveElement.textContent).events.length, 2);
});


test('inventory raw pointer and touch paths cannot mutate items during replay or its menu', () => {
  const source = fs.readFileSync('src/inventory/inventory.ts', 'utf8');
  const ast = ts.createSourceFile('inventory.ts', source, ts.ScriptTarget.Latest, true);
  const cls = ast.statements.find(n => ts.isClassDeclaration(n) && n.name.text === 'Inventory');
  const names = ['handleMouseDown', 'handleMouseUp', 'mouseMove', 'onHoldDetected'];
  const methods = cls.members.filter(n => n.name && names.includes(n.name.getText(ast)));
  assert.equal(methods.length, names.length);
  const context = {};
  vm.runInNewContext(ts.transpileModule(
    'class InventoryInputs {' + methods.map(n => n.getText(ast)).join('\n') + '} instance = new InventoryInputs();',
    {compilerOptions: {target: ts.ScriptTarget.ES2020}}
  ).outputText, context);
  for (const [replaying, menuOpen] of [[true, false], [true, true], [false, true]]) {
    const inv = context.instance;
    inv.game = {replayManager: {isReplaying: () => replaying}};
    inv.player = {replayMenu: {open: menuOpen}};
    for (const field of ['_isKeyboardDragging', 'dragStartMouseX', '_isDragging']) {
      Object.defineProperty(inv, field, {
        configurable: true,
        get() { throw new Error('Unexpected inventory state read: ' + field); },
        set() { throw new Error('Unexpected inventory mutation: ' + field); }
      });
    }
    for (const name of names) inv[name](0, 0, 0);
  }
});


test('finished replay cannot resume or append actions; explicit new game unlocks recording', () => {
  const s = setup(); s.addPlayer(); s.manager.replay(s.game); s.next(); s.next();
  const count = s.manager.getStats().count;
  s.manager.resume(); s.manager.recordAction({type: 'Wait'});
  assert.equal(s.manager.isReplaying(), true);
  assert.equal(s.manager.isPaused(), true);
  assert.equal(s.manager.getStats().count, count);
  s.manager.cancelReplay();
  assert.equal(s.manager.isRecording(), false);
  s.manager.beginRecording(456);
  assert.equal(s.manager.isFinished(), false);
  assert.equal(s.manager.isRecording(), true);
});

test('ladder blackout gates live readiness and replay until all transition flags clear', () => {
  const {isActionReady} = loadReadiness();
  for (const field of ['preLevelGenFadeActive', 'preLevelGenHoldBlack', 'preLevelGenActionStarted', 'transitioningLadder']) {
    const s = setup(); s.addPlayer(); s.manager.replay(s.game);
    s.game[field] = true;
    assert.equal(isActionReady(s.game), false);
    s.next(); assert.equal(s.processed(), 0);
    s.game[field] = false;
    assert.equal(isActionReady(s.game), true);
    s.next(); assert.equal(s.processed(), 1);
  }
});


test('live movement and queued movement are discarded during ladder transitions', () => {
  const context = {exports: {}, require(name) {
    if (name === '../game/actionReadiness') return loadReadiness();
    if (name === '../game/agentMode') return {AGENT_FAST_MODE:false};
    if (name === '../game') return {Direction: {UP: 1, 1: 'UP'}};
    if (name === '../game/gameConstants') return {GameConstants: {isMobile: false}};
    if (name === '../room/room') return {TurnState: {}};
    throw new Error(name);
  }, cancelAnimationFrame() {}};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/player/playerMovement.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
  }).outputText, context);
  const player = {game: {levelState: 1, preLevelGenFadeActive: true}};
  const movement = new context.exports.PlayerMovement(player);
  let executions = 0;
  assert.equal(movement.move(1, 24, -5, () => executions++), false);
  assert.equal(movement.moveMouse(1, 24, -5, () => executions++), false);
  movement.moveQueue = [{x: 24, y: -5, direction: 1, onExecuted: () => executions++}];
  movement.isProcessingQueue = true;
  movement.queueHandler();
  assert.equal(movement.moveQueue.length, 0);
  assert.equal(movement.isProcessingQueue, false);
  assert.equal(executions, 0);
});


test('replay worlds cannot reach save encoding or storage writes', () => {
  const context = {exports: {}, require: () => ({})};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/game/savePersistence.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
  }).outputText, context);
  // Dependencies deliberately expose no encoders/storage: touching them fails.
  context.exports.saveToCookies({replayManager: {isReplaying: () => true}});
});

test('finished replay menu ignores Escape and outside clicks and offers explicit exits', () => {
  const InputEnum = {ESCAPE: 'escape'};
  let resumed = 0;
  const game = {replayManager: {isFinished: () => true, pause() {}, resume() { resumed++; }}};
  const context = {exports: {}, Date, require(name) {
    if (name === '../game') return {Game: {measureText: text => ({width: text.length * 6})}};
    if (name === '../game/gameConstants') return {GameConstants: {WIDTH: 320, HEIGHT: 240}};
    if (name === '../game/gameplaySettings') return {GameplaySettings: {REPLAY_SPEED: 'fast'}};
    if (name === '../game/input') return {InputEnum};
    return {};
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/gui/replayMenu.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
  }).outputText, context);
  const menu = new context.exports.ReplayMenu(game);
  menu.openMenu();
  menu.inputHandler(InputEnum.ESCAPE);
  menu.handleMouseDown(-100, -100);
  assert.equal(menu.open, true);
  assert.equal(menu.openFade.kind, 'opening');
  assert.equal(resumed, 0);
  assert.equal(menu.items[0].label, 'Replay Again');
  assert.equal(menu.items[1].label, 'New Game');
});
