const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('teaching runs do not depend on a seed-registry fetch succeeding', () => {
  const source = fs.readFileSync('agent-teaching-ui.js', 'utf8');
  assert.match(source, /fetch\('\.\/teaching-seeds\.json'\)/);
  assert.match(source, /\.catch\(\(\)=>\(\{reservedSeeds:\[\]\}\)\)/);
  assert.match(source, /await registry\)\.reservedSeeds\.includes\(seed\)/);
});
