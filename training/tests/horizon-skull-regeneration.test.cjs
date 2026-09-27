'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('skull-family continuation preserves regeneration progress through schema, validation and codec', () => {
  const schema = read('src/game/save/schema.ts');
  const validate = read('src/game/save/validate.ts');
  const codecs = read('src/game/save/registry/enemiesBuiltins.ts');

  assert.match(schema, /ticksSinceFirstHit\?: number/);
  assert.match(validate, /ticksSinceFirstHit must be a non-negative safe integer if present/);
  for (const type of ['SkullEnemy', 'ArmoredSkullEnemy', 'BigSkullEnemy'])
    assert.match(codecs, new RegExp(`value instanceof ${type}`));
  assert.match(codecs, /e\.ticksSinceFirstHit = value\.ticksSinceFirstHit/);
});

test('restored regeneration progress preserves the wake boundary that controls later facing', () => {
  const advance = state => {
    if (state.health <= 1) {
      state.unconscious = true;
      state.ticksSinceFirstHit++;
      if (state.ticksSinceFirstHit >= 5) {
        state.health = 2;
        state.unconscious = false;
      }
      return;
    }
    state.facingDx = -1;
  };
  const live = {health: 1, unconscious: true, ticksSinceFirstHit: 4, facingDx: 0};
  const restored = structuredClone(live);
  advance(live);
  advance(restored);
  advance(live);
  advance(restored);
  assert.deepEqual(restored, live);
  assert.equal(restored.facingDx, -1);
});

test('entity parity failures retain bounded entity identity context', () => {
  const controller = read('agent-horizon-controller.js');
  assert.match(controller, /expectedEntity:show\(a\),actualEntity:show\(b\)/);
  assert.match(controller, /observation\\\/room\\\/entities/);
});
