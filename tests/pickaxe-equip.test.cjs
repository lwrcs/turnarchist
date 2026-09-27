const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('pickaxe keeps tool-only gating and delegates to the weapon equip action when enabled', () => {
  const settings = {PICKAXE_AS_TOOL: true};
  class Weapon {
    constructor() {
      this.weaponEquipCalls = 0;
      this.toggleEquip = () => { this.weaponEquipCalls++; };
    }
  }
  const imports = {'../weapon/weapon': {Weapon}, '../../game/gameplaySettings': {GameplaySettings: settings}};
  const context = {exports: {}, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected Pickaxe import: ${name}`);
    return imports[name];
  }};
  const code = ts.transpileModule(fs.readFileSync('src/item/tool/pickaxe.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText;
  vm.runInNewContext(code, context);
  const pickaxe = new context.exports.Pickaxe({}, 0, 0);

  pickaxe.toggleEquip();
  assert.equal(pickaxe.weaponEquipCalls, 0);
  settings.PICKAXE_AS_TOOL = false;
  pickaxe.toggleEquip();
  assert.equal(pickaxe.weaponEquipCalls, 1);
});
