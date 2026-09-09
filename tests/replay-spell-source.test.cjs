const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  class Spellbook {
    spells = [{id: 'plus'}, {id: 'line'}];
    activeSpell = this.spells[0];
    pendingSpell = null;
    fireAtTarget(player, x, y) {
      player.casts.push({book: this, spell: this.pendingSpell.id, x, y});
      this.pendingSpell = null;
      return true;
    }
  }
  const requireMock = name => {
    if (name.endsWith('/saveDiagnostics')) return {traceSaveState() {}};
    if (name.endsWith('/spellbook')) return {Spellbook};
    if (name.endsWith('/spellDiagnostics')) return {traceSpell() {}};
    if (name.endsWith('/actionReadiness')) return {isActionReady: () => true};
    if (name.endsWith('/gameplaySettings')) return {GameplaySettings: {}};
    if (name.endsWith('/game')) return {Direction: {RIGHT: 2, LEFT: 3, UP: 1, DOWN: 0}};
    return {};
  };
  function load(path) {
    const context = {exports: {}, require: requireMock};
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}
    }).outputText, context);
    return context.exports;
  }
  const records = [];
  const book = new Spellbook();
  const player = {x: 0, y: 0, casts: [], inventory: {weapon: {name: 'dagger'}, items: [null, book]},
    game: {replayManager: {isReplaying: () => true, recordAction: a => records.push(a)}}};
  const {RangedTargetingSystem} = load('src/item/weapon/rangedTargetingSystem.ts');
  player.rangedTargeting = new RangedTargetingSystem(player);
  const {PlayerActionProcessor} = load('src/player/playerActionProcessor.ts');
  return {player, book, records, Spellbook, processor: new PlayerActionProcessor(player)};
}

test('replay casts from recorded slot with inactive targeting and a dagger equipped', () => {
  const s = setup();
  s.processor.process({type: 'CastSpell', sourceSlot: 1, spellId: 'line', targetX: 2, targetY: 3});
  assert.equal(s.player.casts.length, 1);
  assert.equal(s.player.casts[0].book, s.book);
  assert.equal(s.player.casts[0].spell, 'line');
  assert.equal(s.player.casts[0].x, 2);
  assert.equal(s.player.inventory.weapon.name, 'dagger');
  assert.equal(s.records[0].sourceSlot, 1);
});

test('legacy cast resolves a unique spellbook without targeting UI', () => {
  const s = setup();
  s.processor.process({type: 'CastSpell', spellId: 'plus', targetX: 1, targetY: 0});
  assert.equal(s.player.casts.length, 1);
});

test('explicit source overrides stale targeting and chooses the requested spell', () => {
  const s = setup(); const other = new s.Spellbook();
  s.player.inventory.items.push(other); s.player.rangedTargeting.start(other);
  s.processor.process({type: 'CastSpell', sourceSlot: 1, spellId: 'line', targetX: 1, targetY: 0});
  assert.equal(s.player.casts[0].book, s.book);
  assert.equal(s.player.casts[0].spell, 'line');
});

test('missing or ambiguous cast sources fail explicitly without firing', () => {
  const s = setup(); s.player.inventory.items.push(new s.Spellbook());
  assert.throws(() => s.processor.process({type: 'CastSpell', spellId: 'plus', targetX: 1, targetY: 0}), /Cannot resolve spell/);
  assert.throws(() => s.processor.process({type: 'CastSpell', sourceSlot: 0, spellId: 'plus', targetX: 1, targetY: 0}), /Cannot resolve spell/);
  assert.equal(s.player.casts.length, 0);
});

test('unrestricted Wait is rejected in live play but retained for historical replay', () => {
  const s=setup();let turns=0;
  s.player.getRoom=()=>({tick(){turns++;}});
  s.player.game.replayManager.isReplaying=()=>false;
  s.processor.process({type:'Wait'});
  assert.equal(turns,0);
  assert.equal(s.records.length,0);
  s.player.game.replayManager.isReplaying=()=>true;
  s.processor.process({type:'Wait'});
  assert.equal(turns,1);
});
