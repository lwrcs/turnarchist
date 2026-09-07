const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, dependencies) {
  const context = {exports: {}, setTimeout, performance, require(name) {
    if (!(name in dependencies)) throw new Error(name);
    return dependencies[name];
  }};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports;
}

function setup(timeoutMs = 500) {
  class DownLadder {}
  const {AgentEnvironment} = load('src/game/agentEnvironment.ts', {
    '../game': {Direction: {UP: 0, DOWN: 1, LEFT: 2, RIGHT: 3}},
    '../room/room': {TurnState: {playerTurn: 0}}, '../tile/downLadder': {DownLadder},
    './actionReadiness': {isActionReady: game => game.levelReady},
    './gameConstants': {GameConstants: {VERSION: 'test', DEVELOPER_MODE: false}},
    './gameplaySettings': {GameplaySettings: {STARTING_HEALTH: 10}},
    './agentPerception': load('src/game/agentPerception.ts', {'../drawable/warningVisibility': load('src/drawable/warningVisibility.ts', {})}),
    './agentTraits': load('src/game/agentTraits.ts', {}),
    './agentContract': load('src/game/agentContract.ts', {
      './gameConstants': {GameConstants: {VERSION: 'test', DEVELOPER_MODE: false}},
      './gameplaySettings': {GameplaySettings: {STARTING_HEALTH: 10}},
    }),
  });
  const actions = [];
  const room = {globalId: 'room', roomX: 0, roomY: 0, width: 3, height: 3,
    turn: 0, depth: 0, roomArray: [[], [], []], entities: [], items: [], hitwarnings: []};
  const player = {x: 1, y: 1, z: 0, health: 10, maxHealth: 10, turnCount: 0,
    dead: false, busyAnimating: false, getRoom: () => room,
    movement: {canMove: () => true}, screenMessage: {open: false},
    inventory: {items: []}, actionProcessor: {process(action) {
      actions.push(action); room.turn = 1;
      setTimeout(() => { player.turnCount++; player.health--; room.turn = 0; }, 5);
    }}};
  const game = {players: {local: player}, localPlayerID: 'local', levelReady: true,
    newGame(seed) { game.seed = seed; actions.length = 0; player.dead = false; },
    replayManager: {cancelReplay() {}, getStats: () => ({count: actions.length}),
      serialize: () => ({actions})}};
  return {env: new AgentEnvironment(game, timeoutMs), game, player, room, actions, DownLadder};
}

test('step returns the settled enemy response and maps movement to adjacent replay actions', async () => {
  const {env, actions} = setup();
  await env.reset(123);
  const result = await env.step({type: 'Move', direction: 'left'});
  assert.equal(result.observation.player.health, 9);
  assert.equal(result.info.turnDelta, 1);
  assert.equal(result.info.recorded, true);
  assert.equal(actions[0].type, 'Directional');
  assert.equal(actions[0].targetX, 0);
  assert.equal(actions[0].targetY, 1);
});

test('malformed actions, internal events and developer commands never execute', async () => {
  const {env, actions} = setup();
  await env.reset(123);
  for (const action of [null, {type: 'Command', command: 'spawn zombie'},
    {type: 'AutoPickup'}, {type: 'Restart'}, {type: 'Move', direction: '__proto__'}]) {
    await assert.rejects(env.step(action), /Unsupported agent action/);
  }
  assert.equal(actions.length, 0);
  assert.equal(env.observe().failure, null);
});

test('an in-flight step excludes other steps and reset without losing its result', async () => {
  const {env} = setup(); await env.reset(123);
  const pending = env.step({type: 'Wait'});
  await assert.rejects(env.step({type: 'Wait'}), /in progress/);
  await assert.rejects(env.reset(456), /in progress/);
  assert.equal((await pending).observation.steps, 1);
  assert.equal(env.observe().seed, 123);
});

test('step budgets truncate independently of death and reset opens a new episode', async () => {
  const {env} = setup(); await env.reset(123, {maxSteps: 1});
  const result = await env.step({type: 'Wait'});
  assert.equal(result.terminated, false);
  assert.equal(result.truncated, true);
  assert.equal(result.observation.ready, false);
  await assert.rejects(env.step({type: 'Wait'}), /Action budget exhausted/);
  assert.equal((await env.reset(456)).steps, 0);
});

test('wall bumps count toward the budget without claiming a recorded action', async () => {
  const {env, player} = setup(); await env.reset(0);
  player.actionProcessor.process = () => {};
  const result = await env.step({type: 'Move', direction: 'up'});
  assert.equal(result.info.recorded, false);
  assert.equal(result.info.turnDelta, 0);
  assert.equal(result.observation.steps, 1);
});

test('timeouts poison the episode so late callbacks cannot contaminate a reset', async () => {
  const {env, player} = setup(15); await env.reset(1);
  player.busyAnimating = true;
  await assert.rejects(env.step({type: 'Wait'}), /timed out/);
  assert.equal(env.observe().truncated, true);
  player.busyAnimating = false;
  await assert.rejects(env.reset(2), /timed out/);
});

test('ladder prompts require an explicit ladder choice', async () => {
  const {env, room, player, DownLadder} = setup(); await env.reset(1);
  room.roomArray[1][1] = new DownLadder(); player.screenMessage.open = true;
  assert.equal(env.observe().decision, 'ladder');
  await assert.rejects(env.step({type: 'Wait'}), /current decision/);
  assert.equal(env.observe().failure, null);
  const result = await env.step({type: 'LadderConfirm'});
  assert.equal(result.info.recorded, true);
});

test('death terminates independently of the step budget', async () => {
  const {env, player} = setup(); await env.reset(1);
  player.actionProcessor.process = () => { player.dead = true; };
  const result = await env.step({type: 'Wait'});
  assert.equal(result.terminated, true);
  assert.equal(result.truncated, false);
  assert.equal(result.observation.ready, false);
  await assert.rejects(env.step({type: 'Wait'}), /Episode ended/);
});

test('observations and exported actions are detached from mutable game objects', async () => {
  const {env, room} = setup(); await env.reset(1);
  room.entities.push({x: 1, y: 2, health: 4});
  const observation = env.observe(); observation.room.entities[0].health = 0;
  assert.equal(room.entities[0].health, 4);
  await env.step({type: 'Wait'});
  const replay = env.exportReplay(); replay.replay.actions.length = 0;
  assert.equal(env.exportReplay().replay.actions.length, 1);
  assert.equal(observation.observationMode, 'diagnostic-current-room');
});

test('bounded history preserves before/after enemy changes and clears on reset', async () => {
  const {env, player, room} = setup(); await env.reset(1);
  const enemy = {globalId: 'enemy-1', x: 2, y: 1, health: 3, maxHealth: 3};
  room.entities.push(enemy);
  const normalProcess = player.actionProcessor.process;
  player.actionProcessor.process = action => { enemy.health++; normalProcess(action); };
  for (let i = 0; i < 10; i++) await env.step({type: 'Wait'});
  const observation = env.observe();
  assert.equal(observation.recentTransitions.length, 8);
  const last = observation.recentTransitions.at(-1);
  assert.equal(last.before.entities[0].health, 12);
  assert.equal(last.after.entities[0].health, 13);
  assert.equal(last.after.entities[0].id, 'enemy-1');
  last.after.entities[0].health = 999;
  assert.equal(env.observe().recentTransitions.at(-1).after.entities[0].health, 13);
  assert.equal((await env.reset(2)).recentTransitions.length, 0);
});

test('agent mode blocks save reads, writes, deletion and ordinary statistics uploads', async () => {
  const persistence = load('src/game/savePersistence.ts', {
    './agentMode': {AGENT_MODE: true}, './saveDiagnostics': {}, '../game': {},
    './gameState': {}, './save': {}, '../utility/cookies': {},
  });
  persistence.saveToCookies({}); persistence.clearCookieSave();
  assert.equal(persistence.hasCookieSave(), false);
  assert.equal(await persistence.loadFromCookies({}), false);
  const api = load('src/api/index.ts', {
    '../game/agentMode': {AGENT_MODE: true}, axios: {default: {create: () => ({
      post() { throw new Error('Unexpected network request'); },
    })}}, './utils': {getEnvironmentApiUrl: () => ''}, uuid: {},
    './claudeGameContext': {}, './gameStrategyGuide': {},
  });
  await api.recordGameStats({});
});


test('a long free-action sequence pauses and resumes without spending a turn or losing state', async () => {
  const {env, player, actions} = setup();
  await env.reset(42, {maxSteps: 100});
  // Fixture executor models arbitrary free decisions, independently of their item semantics.
  player.inventory.items.push({name: 'work in progress', stackCount: 0});
  player.actionProcessor.process = action => {
    actions.push(action);
    player.inventory.items[0].stackCount++;
  };
  for (let i = 0; i < 100; i++) {
    const result = await env.step({type: 'Move', direction: 'up'});
    assert.equal(result.info.turnDelta, 0);
    assert.equal(result.info.predictedTurnCost, null);
  }
  const paused = env.observe();
  assert.equal(paused.truncationReason, 'action-budget');
  assert.equal(paused.terminated, false);
  assert.equal(paused.canExtendBudget, true);
  await assert.rejects(env.step({type: 'Wait'}), /extendBudget/);
  const replayBefore = JSON.stringify(env.exportReplay().replay);
  const resumed = env.extendBudget(100);
  assert.equal(resumed.ready, true);
  assert.equal(resumed.truncated, false);
  assert.equal(resumed.truncationReason, null);
  assert.equal(JSON.stringify(resumed.player), JSON.stringify(paused.player));
  assert.equal(JSON.stringify(resumed.recentTransitions), JSON.stringify(paused.recentTransitions));
  assert.equal(JSON.stringify(env.exportReplay().replay), replayBefore);
  assert.equal(player.inventory.items[0].stackCount, 100);
  assert.equal(resumed.steps, 100);
  assert.equal(resumed.seed, 42);
  await env.step({type: 'Move', direction: 'up'});
  assert.equal(player.inventory.items[0].stackCount, 101);
  assert.equal(player.turnCount, 0);
  assert.equal(player.health, 10);
});

test('budget extensions reject invalid values, uninitialized, busy, failed and dead runs', async () => {
  const {env, player} = setup(15);
  assert.throws(() => env.extendBudget(1), /reset/);
  await env.reset(1);
  for (const value of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => env.extendBudget(value), /positive safe integer/);
  }
  const pending = env.step({type: 'Wait'});
  assert.throws(() => env.extendBudget(1), /in progress/);
  await pending;
  player.dead = true;
  assert.throws(() => env.extendBudget(1), /Episode ended/);
  player.dead = false;
  player.busyAnimating = true;
  await assert.rejects(env.step({type: 'Wait'}), /timed out/);
  assert.throws(() => env.extendBudget(1), /timed out/);
  assert.equal(env.observe().truncationReason, 'failure');
  assert.equal(env.observe().canExtendBudget, false);
});

// Execute selected production methods without constructing the canvas-heavy GUI.
function productionMethods(file, names, globals) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const cls = source.statements.find(ts.isClassDeclaration);
  const members = cls.members.filter(member => names.includes(member.name?.getText(source)));
  assert.equal(members.length, names.length);
  const context = {exports: {}, ...globals};
  vm.runInNewContext(ts.transpileModule(`class C {${members.map(m => m.getText(source)).join('\n')}}; exports.C = C;`, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText, context);
  return context.exports.C;
}

function craftingFixture() {
  const fixture = setup();
  const {env, player, room, game, actions} = fixture;
  game.pushMessage = () => {};
  room.game = game;
  player.game = game;
  player.health = 0.5; player.maxHealth = 2;
  player.stall = () => { player.turnCount++; };
  class Item {
    constructor(level, x, y) { Object.assign(this, {level, x, y, stackCount: 1, broken:false}); }
    getUseTurnCost() { return null; }
  }
  const Sound = new Proxy({}, {get: () => () => {}});
  const settings = {EQUIP_USES_TURN: false};
  const {Equippable} = load('src/item/equippable.ts', {
    './item': {Item}, '../game': {Game:{}}, '../game/gameplaySettings': {GameplaySettings:settings},
  });
  class Weapon extends Equippable {}
  const {Usable} = load('src/item/usable/usable.ts', {'../item': {Item}});
  const {Shrooms} = load('src/item/usable/shrooms.ts', {'./usable':{Usable}, '../../sound/sound':{Sound}});
  const armor = {};
  for (const [name, file] of Object.entries({ChestPlate:'chestPlate', Backplate:'backplate',
    Gauntlets:'gauntlets', ShoulderPlates:'shoulderPlates'})) {
    armor[name] = load(`src/item/${file}.ts`, {'./equippable':{Equippable}})[name];
  }
  class DivingHelmet extends Equippable {}
  const {IronBar, applyIronSmithRecipe} = load('src/item/resource/ironBar.ts', {
    '../item': {Item}, '../../sound/sound':{Sound}, '../divingHelmet':{DivingHelmet},
    '../backplate':{Backplate:armor.Backplate}, '../gauntlets':{Gauntlets:armor.Gauntlets},
    '../shoulderPlates':{ShoulderPlates:armor.ShoulderPlates}, '../chestPlate':{ChestPlate:armor.ChestPlate},
  });
  const {IronOre} = load('src/item/resource/ironOre.ts', {
    '../item':{Item}, '../../sound/sound':{Sound}, './ironBar':{IronBar},
  });
  const unused = class {};
  const {Hammer} = load('src/item/tool/hammer.ts', {
    '../usable/usable':{Usable}, '../weapon/weapon':{Weapon}, '../../sound/sound':{Sound},
    '../resource/ironBar':{IronBar}, '../resource/ironOre':{IronOre},
    '../resource/goldOre':{GoldOre:unused}, '../resource/goldBar':{GoldBar:unused},
    '../usable/weaponFragments':{WeaponFragments:unused}, '../../utility/random':{Random:{}},
  });
  const Inventory = productionMethods('src/inventory/inventory.ts',
    ['itemUse', 'itemUseAt', 'itemUseOnAt', 'swapSlots'], {Item, Usable, Equippable, Weapon});
  const inventory = new Inventory();
  Object.assign(inventory, {player, cols:10, usingItem:null, equipAnimAmount:[], items:Array(20).fill(null),
    isFull: () => inventory.items.every(Boolean),
    hasItem: Type => inventory.items.find(item => item instanceof Type),
    removeItem: item => { inventory.items[inventory.items.indexOf(item)] = null; },
    subtractItem: (item, count) => { item.stackCount -= count; if (!item.stackCount) inventory.removeItem(item); },
    addItem: item => {
      const stack = item.stackable && inventory.hasItem(item.constructor);
      if (stack) stack.stackCount += item.stackCount;
      else { inventory.items[inventory.items.indexOf(null)] = item; if (item.setWielder) item.setWielder(player); }
    },
  });
  player.inventory = inventory;
  class guiButton {constructor(x,y,w,h,text,onClick) {this.onClick=onClick;}}
  const Menu = productionMethods('src/gui/menu.ts',
    ['getSelectionChoices', 'selectChoice', 'close', 'openSelectionMenu'], {guiButton});
  const menu = new Menu();
  Object.assign(menu, {open:false, buttons:[], buttonStack:[], positionButtons() {},
    addButton(button) {this.buttons.push(button);}, openMenu() {this.open=true;}});
  player.menu = menu;
  player.actionProcessor.process = action => {
    if (action.type === 'UseItem') inventory.itemUseAt(action.slotIndex);
    else if (action.type === 'UseItemOn') inventory.itemUseOnAt(action.fromSlot, action.toSlot);
    else if (action.type === 'MoveItem') inventory.swapSlots(action.fromSlot, action.toSlot);
    else if (action.type === 'SmithRecipe') applyIronSmithRecipe(player, action.recipe);
    else throw new Error(`Unexpected fixture action ${action.type}`);
    actions.push(action);
  };
  const hammer = new Hammer(room,0,0), ore = new IronOre(room,0,0), food = new Shrooms(room,0,0);
  ore.stackCount=13; food.stackCount=3;
  inventory.items[0]=hammer; inventory.items[1]=ore; inventory.items[2]=food;
  return {...fixture, settings, IronBar, applyIronSmithRecipe, inventory};
}

test('real smelting, crafting menu, armor equip and healing survive a mid-menu budget pause', async () => {
  const {env, player, inventory, actions, IronBar} = craftingFixture();
  await env.reset(42, {maxSteps:14});
  for (let i=0;i<13;i++) {
    const result = await env.step({type:'UseItemOn', fromSlot:0, toSlot:1});
    assert.equal(result.info.predictedTurnCost,0);
    assert.equal(result.info.turnDelta,0);
  }
  const bars = inventory.items.findIndex(item => item instanceof IronBar);
  const opened = await env.step({type:'UseItemOn', fromSlot:0, toSlot:bars});
  assert.equal(opened.observation.decision,'selection');
  assert.equal(opened.truncated,true);
  const choices = JSON.stringify(opened.observation.selectionChoices);
  assert.equal(JSON.stringify(env.extendBudget(40).selectionChoices),choices);
  for (let recipe=0;recipe<4;recipe++) {
    if (recipe>0) await env.step({type:'UseItemOn', fromSlot:0, toSlot:bars});
    const crafted = await env.step({type:'SelectOption',index:recipe});
    assert.equal(crafted.info.predictedTurnCost,0);
    assert.equal(crafted.info.turnDelta,0);
    assert.equal(crafted.observation.decision,'world');
  }
  const armorSlots = inventory.items.flatMap((item,slot) => item?.toggleEquip ? [slot] : []);
  for (const slotIndex of armorSlots) {
    const result = await env.step({type:'UseItem',slotIndex});
    assert.equal(result.observation.inventory[slotIndex].equipped,true);
    assert.equal(result.observation.inventory[slotIndex].activeWeapon,false);
    assert.equal(result.info.predictedTurnCost,0);
  }
  for (let i=0;i<3;i++) await env.step({type:'UseItem',slotIndex:2});
  assert.equal(player.health,2);
  assert.equal(player.turnCount,0);
  assert.equal(actions.filter(action => action.type==='SmithRecipe').length,4);
});

test('crafting enforces menu context, enabled recipes and inventory slot validation', async () => {
  const {env, inventory, IronBar, player, applyIronSmithRecipe} = craftingFixture();
  await env.reset(1);
  for (const action of [{type:'SelectOption',index:0}, {type:'SmithRecipe',recipe:'chestPlate'},
    {type:'UseItem',slotIndex:0}, {type:'UseItem',slotIndex:1.2}, {type:'UseItem',slotIndex:99},
    {type:'UseItemOn',fromSlot:2,toSlot:1}, {type:'MoveItem',fromSlot:0,toSlot:99}]) {
    await assert.rejects(env.step(action));
    assert.equal(env.observe().failure,null);
  }
  assert.equal(applyIronSmithRecipe(player,'__proto__'),false);
  await env.step({type:'UseItemOn',fromSlot:0,toSlot:1});
  const bars = inventory.items.findIndex(item=>item instanceof IronBar);
  await env.step({type:'UseItemOn',fromSlot:0,toSlot:bars});
  await assert.rejects(env.step({type:'SelectOption',index:0}), /disabled/);
  await assert.rejects(env.step({type:'UseItem',slotIndex:2}), /current decision/);
  const cancel = await env.step({type:'SelectOption',index:5});
  assert.equal(cancel.observation.decision,'world');
  assert.equal(cancel.info.recorded,false);
  assert.equal(cancel.info.turnDelta,0);
});

test('equipment cost follows the current gameplay setting and equipped state', async () => {
  const {env, settings, inventory, player, IronBar, applyIronSmithRecipe} = craftingFixture();
  await env.reset(1);
  for (let i=0;i<4;i++) await env.step({type:'UseItemOn',fromSlot:0,toSlot:1});
  applyIronSmithRecipe(player,'chestPlate');
  const slotIndex=inventory.items.findIndex(item=>item?.toggleEquip);
  settings.EQUIP_USES_TURN=true;
  const equipped=await env.step({type:'UseItem',slotIndex});
  assert.equal(equipped.info.predictedTurnCost,1);
  assert.equal(equipped.info.turnDelta,1);
  const unequipped=await env.step({type:'UseItem',slotIndex});
  assert.equal(unequipped.info.predictedTurnCost,0);
  assert.equal(unequipped.info.turnDelta,0);
});


test('diagnostic scenario reset forwards its seed, labels exports and rejects unknown presets', async () => {
  const {env, game} = setup();
  const calls=[];
  game.startLightingSandbox=(scenario,seed)=>calls.push({scenario,seed});
  const observation=await env.reset(123,{scenario:'forest'});
  assert.equal(observation.scenario,'forest');
  assert.equal(calls[0].seed,123);
  assert.equal(env.exportReplay().diagnosticSandbox,true);
  assert.equal(env.exportReplay().scenario,'forest');
  await assert.rejects(env.reset(1,{scenario:'Command'}),/Unsupported diagnostic scenario/);
  assert.equal(env.observe().failure,null);
  await env.reset(123);
  assert.equal(env.exportReplay().diagnosticSandbox,false);
});

test('dismissible interactions close through the recorded action processor without a turn', async()=>{
  const {env,player,actions}=setup();await env.reset(1);
  player.openVendingMachine={open:true,close(){this.open=false;}};
  player.contextMenu={close(){}};player.screenMessage.close=()=>{player.screenMessage.open=false;};
  const Processor=productionMethods('src/player/playerActionProcessor.ts',['process'],{isActionReady:()=>true});
  const processor=new Processor();processor.player=player;processor.record=action=>actions.push(action);player.actionProcessor=processor;
  assert.equal(env.perceive ? env.observe().decision : null,'dismissable-interaction');
  await assert.rejects(env.step({type:'Wait'}),/current decision/);
  const result=await env.step({type:'DismissInteraction'});
  assert.equal(result.info.turnDelta,0);assert.equal(result.info.recorded,true);
  assert.equal(result.observation.decision,'world');
  assert.equal(actions[0].type,'DismissInteraction');
});
