const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('wall placement fallback consumes seeded gameplay RNG', () => {
  const source = fs.readFileSync('src/player/playerInputHandler.ts', 'utf8');
  assert.match(source, /import \{ Random \} from "\.\.\/utility\/random"/);
  assert.match(source, /freeWalls\[Math\.floor\(Random\.rand\(\) \* freeWalls\.length\)\]/);
  assert.doesNotMatch(source, /freeWalls\[Math\.floor\(Math\.random\(\) \* freeWalls\.length\)\]/);
});
