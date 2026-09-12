const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const context = {exports: {}, console: {log() {}}, require: name => dependencies[name]};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports;
}

test('a fleeing rat treats the player as blocked even if pathfinding returns that tile', () => {
  class Enemy {
    constructor(room, game, x, y) { Object.assign(this, {room, game, x, y, dead: false}); }
    getDrop() {}
  }
  class SpikeTrap {}
  const Direction = {UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3};
  const {RatEnemy} = load('src/entity/enemy/ratEnemy.ts', {
    '../../game': {Direction, Game: class {}},
    '../../room/room': {Room: class {}},
    '../../utility/astarclass': {astar: {}},
    '../../tile/spiketrap': {SpikeTrap},
    '../../player/player': {Player: class {}},
    '../../item/item': {Item: class {}},
    '../../game/gameConstants': {GameConstants: {}},
    './enemy': {Enemy},
  });
  const tile = () => ({isSolid: () => false});
  const room = {
    playerTicked: null,
    roomArray: Array.from({length: 7}, () => Array.from({length: 7}, tile)),
    vis: Array.from({length: 7}, () => Array(7).fill(0.1)),
  };
  let damage = 0;
  const player = {x: 4, y: 3, levelID: 'room', hurt: amount => {damage += amount;}};
  room.playerTicked = player;
  const game = {players: {local: player}, rooms: {room}, localPlayerID: 'local', offlinePlayers: {}, shakeScreen() {}};
  const rat = Object.assign(new RatEnemy(room, game, 3, 3), {
    seenPlayer: true, aggro: true, ticks: 0, targetPlayer: player,
    _cachedDarkFlee: {x: 1, y: 3}, _cachedMaxLum: 0.8, _cachedMinLum: 0.1,
    handleSkipTurns: () => false, getLuminance: () => 0.8,
    getEntityDisablePositions: () => [], shouldSkipAttack: () => false,
    hit: () => 0.5, makeHitWarnings() {},
  });
  let disabled = [];
  rat.searchPathLocalizedCached = (_target, positions) => {
    disabled = positions;
    return [{pos: {x: player.x, y: player.y}}];
  };
  rat.behavior();
  assert.equal(damage, 0);
  assert.ok(disabled.some(pos => pos.x === player.x && pos.y === player.y));
  assert.equal(rat.x, 3);
  assert.equal(rat.y, 3);
});
