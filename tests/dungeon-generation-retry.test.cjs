const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the production retry method with controlled candidate and validator
// collaborators. A guard in the negative case stops the pre-fix infinite loop.
const file = 'src/level/partitionGenerator.ts';
const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
const generator = source.statements.find(node =>
  ts.isClassDeclaration(node) && node.name?.text === 'PartitionGenerator');
const member = generator.members.find(node => node.name?.getText(source) === 'generateDungeonPartitions');
class PartialLevel { constructor() { this.partitions = []; } }
const context = {exports: {}, PartialLevel, console: {log() {}}};
vm.runInNewContext(ts.transpileModule(`export class Fixture {${member.getText(source)}}`, {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
}).outputText, context);
const {Fixture} = context.exports;
const params = Object.freeze({minRoomCount: 3, maxRoomCount: 6, maxRoomArea: 40,
  mapWidth: 25, mapHeight: 25, splitProbabilities: [0.75, 1, 0.25],
  wallRemoveProbability: 1, numLoopDoorsRange: [4, 8], numberOfRooms: 3,
  softMaxRoomArea: 40});
const route = {seed: 12345, pathId: 'main'};

function fixture(candidate, validate) {
  const instance = new Fixture();
  instance.generateDungeonCandidate = candidate;
  instance.validator = {validateDungeonPartitions: validate};
  instance.visualizer = {
    updateProgress() {}, setVisualizationState() {},
    async createAnimationDelay() {}, createVisualEffect() {},
  };
  return instance;
}

test('persistent rejection stops before an unbounded extra candidate and reports the cause', async () => {
  let candidates = 0;
  const instance = fixture(async (_game, partial) => {
    candidates++;
    if (candidates > 250) throw new Error('test guard: unbounded candidate loop');
    partial.partitions = [{candidate: candidates}];
  }, () => ({isValid: false, errorType: 'BOSS_TOO_CLOSE',
    errorMessage: 'Boss room is too close'}));

  await assert.rejects(
    instance.generateDungeonPartitions({}, 25, 25, 2, params, {branching: 0.4}, route),
    error => {
      assert.match(error.message, /Dungeon generation failed after 250 candidates/);
      for (const text of ['12345', 'main', 'BOSS_TOO_CLOSE', 'Boss room is too close',
        '"depth":2', '"branching":0.4', '"maxRoomCount":6']) {
        assert.ok(error.message.includes(text), `missing failure context: ${text}`);
      }
      return true;
    },
  );
  assert.equal(candidates, 250);
});

test('a valid later candidate returns without an extra retry or random draw', async () => {
  let randomState = 7;
  const draws = [];
  let validations = 0;
  const instance = fixture(async (_game, partial) => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    draws.push(randomState);
    partial.partitions = [{candidate: draws.length, randomState}];
  }, () => ({isValid: ++validations === 2,
    errorMessage: validations === 1 ? 'first candidate rejected' : undefined}));

  const result = await instance.generateDungeonPartitions({}, 25, 25, 0, params,
    {branching: 0.4}, route);
  assert.equal(validations, 2);
  assert.deepEqual(draws, [1025555898, 3923423697]);
  assert.equal(result[0].candidate, 2);
  assert.equal(result[0].randomState, randomState);
});
