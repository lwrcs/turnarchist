const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function compile(source,globals={}) {
  const context={exports:{},...globals};
  vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
  return context.exports;
}
const config=compile(fs.readFileSync('src/game/combatTestbed.ts','utf8'));
const source=ts.createSourceFile('game.ts',fs.readFileSync('src/game.ts','utf8'),ts.ScriptTarget.Latest,true);
const gameClass=source.statements.find(s=>ts.isClassDeclaration(s)&&s.name?.text==='Game');
const methods=gameClass.members.filter(m=>['startCombatSandbox','startSidepathSandbox'].includes(m.name?.getText(source))).map(m=>m.getText(source)).join('\n');
function setup(encounter=config.combatEncounter) {
  class Tile {isSolid(){return false;}}
  class Wall extends Tile {isSolid(){return true;}}
  class Room {
    constructor(game,x,y,w,h){Object.assign(this,{game,roomX:x,roomY:y,width:w,height:h,roomArray:Array.from({length:w},()=>[]),entities:[],lightSources:[],globalId:'room'});}
    calculateWallInfo(){} roomOnScreen(){} updateLighting(){}
  }
  class Level {constructor(){this.roomsById=new Map();this.globalId='level';}}
  class Player {constructor(game,x,y){Object.assign(this,{game,x,y});}}
  const EnemyTypeMap=Object.fromEntries(['skull','zombie','bigskull','bigzombie','spawner'].map(type=>[type,{add(room,game,x,y){
    const size=type.startsWith('big')?2:1;
    room.entities.push({type,x,y,w:size,h:size,pointIn(tx,ty){return tx>=x&&tx<x+size&&ty>=y&&ty<y+size;}});
  }}]));
  const {Game}=compile(`export class Game {${methods}}`,{
    ...config,combatEncounter:encounter,EnvType:{DUNGEON:0},RoomType:{START:0},LevelState:{IN_LEVEL:0},Random:{rand:()=>.5},
    LevelGenerator:class {setSeed(){} setMainPathEnvOverride(){}},
    Room,Level,Player,Wall,Floor:Tile,require:()=>({Bush:{add(room,game,x,y){room.entities.push({type:'bush',x,y,w:1,h:1,pointIn(tx,ty){return tx===x&&ty===y;}});}}}),LightSource:class {},EnemyTypeMap,
    DownLadder:class {constructor(){throw new Error('Combat testbed created a ladder');}}
  });
  const game=new Game();game.localPlayerID='local';game.setActiveRoom=r=>game.room=r;game.setPlayer=()=>{};
  game.replayManager={beginRecording:seed=>game.recordedSeed=seed};
  return game;
}
test('all combat presets create a large enclosed room with clear complete footprints',()=>{
  for(const scenario of config.COMBAT_SCENARIOS) {
    const game=setup();game.startCombatSandbox(scenario,123);
    const room=game.room,layout=config.combatEncounter(scenario),player=game.players.local;
    assert.equal(room.width,25);assert.equal(room.height,25);
    assert.equal(player.x,12);assert.equal(player.y,12);
    assert.equal(room.entities.length,layout.enemies.length+layout.objects.length);
    assert.equal(game.recordedSeed,123);assert.equal(room.lightSources.length,1);
    for(let x=0;x<25;x++)for(let y=0;y<25;y++)assert.equal(room.roomArray[x][y].isSolid(),x===0||y===0||x===24||y===24||layout.walls.some(w=>w.x===x&&w.y===y));
    for(const e of room.entities) {
      assert.equal(e.pointIn(player.x,player.y),false);
      assert.equal(room.entities.some(other=>other!==e&&other.pointIn(e.x,e.y)),false);
    }
    const first=JSON.stringify(room.entities);
    game.startCombatSandbox(scenario,123);assert.equal(JSON.stringify(game.room.entities),first);
  }
});
test('unknown combat scenarios are rejected before replacing the current room',()=>{
  const game=setup();assert.throws(()=>game.startCombatSandbox('combat-unknown',123),/Unsupported/);
  assert.equal(game.room,undefined);
});

test('a giant whose anchor is clear but body intersects a wall is rejected',()=>{
  const game=setup(scenario=>({...config.combatEncounter(scenario),enemies:[{type:'bigskull',x:23,y:12}]}));
  assert.throws(()=>game.startCombatSandbox('combat-bigskull',123),/occupied spawn footprint/);
});

test('obstacle encounters retain a walkable escape from the starting position',()=>{
  for(const scenario of ['combat-giant-pocket','combat-skull-choke']) {
    const game=setup();game.startCombatSandbox(scenario,123);const room=game.room;
    const queue=[[12,12]],seen=new Set(['12,12']);
    for(let i=0;i<queue.length;i++)for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const [x,y]=[queue[i][0]+dx,queue[i][1]+dy],key=`${x},${y}`;
      if(seen.has(key)||!room.roomArray[x]?.[y]||room.roomArray[x][y].isSolid()||room.entities.some(e=>e.pointIn(x,y)))continue;
      seen.add(key);queue.push([x,y]);
    }
    assert.equal(seen.has('1,1'),true,scenario);
  }
});
