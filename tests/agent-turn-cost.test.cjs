const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const context = {exports: {}, require(name) {
    if (!(name in dependencies)) throw new Error(name);
    return dependencies[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports;
}

const {observeItem} = load('src/game/agentTraits.ts', {});

function setup() {
  const enemy = {health: 100, pushable: false};
  let turns = 0;
  const room = {entities: [enemy], particles: [], tick() { turns++; },
    tickHitWarnings() {}, clearDeadStuff() {}};
  const player = {levelID: 0, direction: 0, setHitXY() {}, beginSlowMotion() {}};
  const game = {rooms: [room], players: {}, localPlayerID: 'local'};
  class Weapon {
    constructor() { this.game = game; this.wielder = player; this.damage = 1; }
    getEntitiesAt() { return room.entities; }
    attack(target, damage) { target.health -= damage; }
    statusEffect() {}
    shakeScreen() {}
    degrade() {}
  }
  const {DualDagger} = load('src/item/weapon/dualDagger.ts', {
    './weapon': {Weapon}, '../../sound/sound': {Sound: {swing() {}, playShortSlice() {}}},
    '../../particle/attackAnimation': {AttackAnimation: class {}},
  });
  return {daggers: new DualDagger(room, 0, 0), otherDaggers: new DualDagger(room, 0, 0),
    room, enemy, turns: () => turns};
}

test('real dual-dagger hits expose and consume their current 0/1 turn cost', () => {
  const {daggers, enemy, turns} = setup();
  assert.equal(observeItem(daggers).traits.successfulAttackTurnCost, 0);
  assert.equal(daggers.weaponMove(1, 0), false);
  assert.equal(turns(), 0);
  assert.equal(enemy.health, 99);
  assert.equal(observeItem(daggers).traits.successfulAttackTurnCost, 1);
  daggers.weaponMove(1, 0);
  assert.equal(turns(), 1);
  assert.equal(enemy.health, 98);
  // Inventory tick is the game's turn-boundary reset, not a decision counter.
  daggers.tickInInventory();
  assert.equal(observeItem(daggers).traits.successfulAttackTurnCost, 0);
});

test('swapping between two dual-dagger instances preserves each free-hit phase', () => {
  const {daggers, otherDaggers, turns} = setup();
  daggers.weaponMove(1, 0);
  otherDaggers.weaponMove(1, 0);
  assert.equal(turns(), 0);
  assert.equal(daggers.getSuccessfulAttackTurnCost(), 1);
  assert.equal(otherDaggers.getSuccessfulAttackTurnCost(), 1);
  daggers.weaponMove(1, 0);
  assert.equal(turns(), 1);
});

test('a miss does not use the free hit; unknown weapons have no invented cost', () => {
  const {daggers, room, turns} = setup();
  room.entities = [];
  assert.equal(daggers.weaponMove(1, 0), true);
  assert.equal(daggers.getSuccessfulAttackTurnCost(), 0);
  assert.equal(turns(), 0);
  assert.equal(observeItem({name: 'new mechanic'}).traits.successfulAttackTurnCost, null);
});

test('hourglass stalling consumes a limited charge and stops when exhausted', () => {
  class Usable { constructor(){this.broken=false;} }
  const {Hourglass}=load('src/item/usable/hourglass.ts',{'./usable':{Usable}});
  const glass=new Hourglass({},0,0);
  let turns=0;
  const player={stall(){turns++;},game:{pushMessage(){}}};
  assert.equal(observeItem(glass).useTurnCost,1);
  for(let i=0;i<30;i++)glass.onUse(player);
  assert.equal(turns,30);
  assert.equal(glass.durability,0);
  assert.equal(glass.broken,true);
  assert.equal(observeItem(glass).useTurnCost,0);
  glass.onUse(player);
  assert.equal(turns,30);
  glass.broken=false;
  glass.onUse(player);
  assert.equal(turns,30);
});
