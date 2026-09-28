const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the real Populator method without constructing an entire dungeon.
const file = 'src/room/roomPopulator.ts';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const populator = source.statements.find(node => ts.isClassDeclaration(node) && node.name?.text === 'Populator');
const member = populator.members.find(node => node.name?.getText(source) === 'clearFloorForBigEnemy');
class Floor {
  constructor(room, x, y) { Object.assign(this, {room, x, y}); }
}
const context = {exports: {}, Floor};
vm.runInNewContext(ts.transpileModule(`export class Fixture {${member.getText(source)}}`, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText, context);
const {Fixture} = context.exports;

function roomFixture() {
  const roomArray = Array.from({length: 7}, (_, x) =>
    Array.from({length: 7}, (_, y) => ({x, y, original: true})));
  const enemy = {x: 2, y: 2};
  const removedLights = [];
  const displaced = {x: 3, y: 2, lightSource: {id: 'displaced'},
    removeLightSource(light) { removedLights.push(light); }};
  const room = {roomArray, entities: [enemy, displaced]};
  return {room, enemy, displaced, removedLights};
}

for (const [label, x, y] of [
  ['same column only', 3, 5],
  ['same row only', 5, 2],
  ['neither coordinate', 5, 5],
]) {
  test(`clearing a 2x2 footprint retains an entity in ${label}`, () => {
    const {room, enemy, displaced, removedLights} = roomFixture();
    const neighbor = {x, y, lightSource: {id: label},
      removeLightSource() { assert.fail('unrelated light source was removed'); }};
    room.entities.push(neighbor);
    const outsideTile = room.roomArray[x][y];

    new Fixture().clearFloorForBigEnemy(room, 2, 2, 2, 2, enemy);

    assert.deepEqual(room.entities, [enemy, neighbor]);
    assert.deepEqual(removedLights, [displaced.lightSource]);
    assert.equal(room.roomArray[x][y], outsideTile);
    for (const [fx, fy] of [[2, 2], [2, 3], [3, 2], [3, 3]]) {
      assert.ok(room.roomArray[fx][fy] instanceof Floor);
    }
  });
}
