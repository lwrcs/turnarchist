const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies = {}, globals = {}) {
  const context = {exports: {}, ...globals, require: name => {
    if (!(name in dependencies)) throw new Error(name);
    return dependencies[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports;
}
const traits = load('src/game/agentTraits.ts');

test('unseen enemies expose changed traits without species-specific registration', () => {
  class FutureEnemy {}
  const enemy = Object.assign(new FutureEnemy(), {globalId: 'new-1', health: 4,
    maxHealth: 4, baseDamage: 1, diagonalAttack: true, internalSecretState: 99});
  const before = traits.observeEntity(enemy);
  enemy.health = 12; enemy.maxHealth = 12; enemy.baseDamage = 3;
  const after = traits.observeEntity(enemy);
  assert.equal(before.health, 4);
  assert.equal(after.health, 12);
  assert.equal(after.maxHealth, 12);
  assert.equal(after.combat.baseDamage, 3);
  assert.equal(after.combat.diagonalAttack, true);
  assert.equal(after.combat.movementPeriodTurns, null);
  assert.equal(after.internalSecretState, undefined);
});

test('new weapons expose live numeric traits rather than defaults keyed on their names', () => {
  class FutureWeapon {}
  const weapon = Object.assign(new FutureWeapon(), {name: 'new weapon', damage: 2,
    range: 1, cooldown: 0, durability: 4, allowsDiagonalAttack: false});
  assert.equal(traits.observeItem(weapon).traits.baseDamage, 2);
  weapon.damage = 7; weapon.range = 4;
  const observed = traits.observeItem(weapon);
  assert.equal(observed.traits.baseDamage, 7);
  assert.equal(observed.traits.range, 4);
  assert.equal(observed.traits.cooldown, 0);
  assert.equal(observed.traits.allowsDiagonalAttack, false);
  assert.equal(observed.traits.attackPattern, null);
  observed.traits.durability = 0;
  assert.equal(weapon.durability, 4);
});

test('missing, non-finite and wrong-typed features remain unknown', () => {
  const observed = traits.observeItem({damage: NaN, range: Infinity, cooldown: '0'});
  for (const name of ['baseDamage', 'range', 'cooldown', 'manaCost', 'allowsDiagonalAttack']) {
    assert.equal(observed.traits[name], null);
  }
});

test('fish exposes the same one-health recovery used by gameplay', () => {
  class Item { constructor(level,x,y){Object.assign(this,{level,x,y,stackCount:1});} getAgentCategories(){return [];} }
  class Usable extends Item { getAgentCategories(){return ['usable'];} }
  const {Fish}=load('src/item/usable/fish.ts', {
    '../item':{Item}, '../../player/player':{Player:class{}}, '../../game':{Game:{}},
    '../../room/room':{Room:class{}}, '../../particle/textParticle':{TextParticle:class{}},
    '../../game/gameConstants':{GameConstants:{}}, './usable':{Usable},
    '../../sound/sound':{Sound:{playEat(){}}},
  });
  assert.equal(traits.observeItem(new Fish({},0,0)).healingAmount,1);
});

test('facing follows the gameplay direction enum and spawner type comes from an explicit trait',()=>{
  const e={direction:2,getAgentSpawnTraits:()=>({enemyType:'skull'})};
  const t=traits.observeEntity(e);assert.equal(t.facing.dx,1);assert.equal(t.facing.dy,0);assert.equal(t.spawner.enemyType,'skull');
  assert.equal(traits.observeEntity({direction:99}).facing,null);
});

test('warning changes and removal are reflected without inventing timing', () => {
  const warning = {x: 1, y: 2, dead: false, parent: {globalId: 'enemy-1', z: 3},
    getSaveFields: () => ({eX: 0, eY: 2, isEnemy: true, dirOnly: false})};
  const before = traits.observeWarnings([warning]);
  warning.x = 4;
  const after = traits.observeWarnings([warning]);
  assert.equal(before[0].x, 1);
  assert.equal(after[0].x, 4);
  assert.equal(after[0].z, 3);
  assert.equal(after[0].sourceId, 'enemy-1');
  assert.equal(after[0].resolvesInTurns, null);
  assert.equal(after[0].phase, 'fading-in');
  assert.equal(after[0].dangerous, true);
  warning.dead = true;
  assert.equal(traits.observeWarnings([warning]).length, 0);
});

test('resolved fading warnings are labeled safe and parentless warnings retain their layer',()=>{
  let active=true;
  const warning={x:1,y:2,dead:false,parent:null,isActive:()=>active,getSaveFields:()=>({isEnemy:false,dirOnly:false})};
  assert.equal(traits.observeWarnings([warning])[0].z,0);
  active=false;
  const resolved=traits.observeWarnings([warning])[0];
  assert.equal(resolved.phase,'fading-out');assert.equal(resolved.dangerous,false);
});

test('real warning lifecycle stops threatening on its first tick, before cleanup',()=>{
  const {HitWarning}=load('src/drawable/hitWarning.ts',{'./warningVisibility':{isWarningVisibleAboveShade:()=>true},'../game':{Game:{}},'./drawable':{Drawable:class{}},'../utility/utils':{Utils:{}}});
  const game={room:{entities:[],doors:[]}};
  const warning=new HitWarning(game,1,0,0,0,true);
  assert.equal(warning.isActive(),true);
  warning.tick();
  assert.equal(warning.dead,false);
  assert.equal(warning.isActive(),false);
  const resolved=traits.observeWarnings([warning])[0];
  assert.equal(resolved.phase,'fading-out');assert.equal(resolved.dangerous,false);
  warning.tick();assert.equal(warning.dead,true);
  // Dead warnings must not touch rendering state even before array cleanup.
  warning.draw(1);warning.drawTopLayer(1);
});

test('checkpoint metadata distinguishes interface mismatch, changed build and changed settings', () => {
  const settings = {STARTING_HEALTH: 2};
  const contract = load('src/game/agentContract.ts', {
    './gameConstants': {GameConstants: {VERSION: 'alpha', DEVELOPER_MODE: false}},
    './gameplaySettings': {GameplaySettings: settings},
  }, {__webpack_hash__: 'build-A'});
  const trainedOn = contract.getAgentContract();
  assert.equal(contract.checkAgentCompatibility(trainedOn).requiresEvaluation, false);
  assert.equal(contract.checkAgentCompatibility({...trainedOn, buildId: 'build-B'}).requiresEvaluation, true);
  assert.equal(contract.checkAgentCompatibility({...trainedOn, observationSchemaVersion: 1}).schemaCompatible, false);
  assert.equal(contract.checkAgentCompatibility({...trainedOn, observationMode: 'player-visible'}).schemaCompatible, false);
  settings.STARTING_HEALTH = 10;
  const result = contract.checkAgentCompatibility(trainedOn);
  assert.equal(result.schemaCompatible, true);
  assert.equal(result.sameSettings, false);
  assert.equal(result.requiresEvaluation, true);
  assert.equal(contract.checkAgentCompatibility(null).schemaCompatible, false);
});

test('missing build identity cannot claim a validated matching build', () => {
  const contract = load('src/game/agentContract.ts', {
    './gameConstants': {GameConstants: {}}, './gameplaySettings': {GameplaySettings: {}},
  });
  assert.equal(contract.getAgentContract().buildId, null);
  assert.equal(contract.checkAgentCompatibility(contract.getAgentContract()).requiresEvaluation, true);
});
