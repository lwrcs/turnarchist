'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const P=require(process.env.HORIZON_EMPTY_LOOT_MODULE);
const source=ts.createSourceFile('entity.ts',fs.readFileSync('src/entity/entity.ts','utf8'),ts.ScriptTarget.Latest,true);
const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='Entity');
const method=cls.members.find(n=>n.name?.getText(source)==='dropLoot').getText(source);
function compile(text,context){const out=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};vm.runInNewContext(out,{exports,...context});return exports;}
class Item {constructor(level,x,y){Object.assign(this,{level,x,y});}onPickup(player){player.coins+=this.stackCount;this.level.items=this.level.items.filter(i=>i!==this);}}
const {Coin}=compile(fs.readFileSync('src/item/coin.ts','utf8'),{require:()=>({Item,GameConstants:{COIN_AUTO_PICKUP:true}})});
const {Entity}=compile(`export class Entity {${method}}`,{Coin,XpCrystal:class{},Random:{rand:()=>0}});
function fixture(rerolled=false){const player={coins:2},room={globalId:'R-loot',roomArray:[],items:[],entities:[],game:{localPlayerID:'local',players:{local:player}}};
 room.roomArray[18]=[];room.roomArray[18][5]={isSolid:()=>false};
 const e=new Entity();Object.assign(e,{globalId:'EN-loot',room,x:18,y:5,z:0,w:1,h:1,dead:false,isEnemy:true,name:'zombie',lootDropped:false,
  drops:rerolled?[{name:'fishing rod',onDrop(){},autoPickup(){}}]:[]});room.entities=[e];return {e,rooms:[room],player};}
test('actual dropLoot and Coin expose empty-versus-rerolled loot coin mismatch',()=>{
 const live=fixture(),loaded=fixture(true);live.e.dropLoot();loaded.e.dropLoot();
 assert.equal(live.player.coins,3);assert.equal(loaded.player.coins,2);
});
test('captured empty loot restores fallback coin semantics without changing dropLoot',()=>{
 const live=fixture(),loaded=fixture(true),saved=P.capturePlanningEmptyLoot(live.rooms);
 P.restorePlanningEmptyLoot(saved,loaded.rooms);loaded.e.dropLoot();
 assert.equal(loaded.player.coins,3);assert.equal(loaded.e.lootDropped,true);
 loaded.e.dropLoot();assert.equal(loaded.player.coins,3);assert.equal(live.e.drops.length,0);
});
test('nonempty preselected loot is not relabelled as empty by this narrow codec',()=>{
 const f=fixture(true);assert.equal(P.capturePlanningEmptyLoot(f.rooms).entities.length,0);
});
for(const bad of ['owner','class','flag','duplicate','unknown-field'])test('empty-loot malformed input is rejected atomically: '+bad,()=>{
 const f=fixture(),r=fixture(true),s=P.capturePlanningEmptyLoot(f.rooms),old=r.e.drops;
 if(bad==='owner')s.entities[0].gid='missing';if(bad==='class')s.entities[0].kind='Wrong';
 if(bad==='flag')s.entities[0].lootDropped='false';if(bad==='duplicate')s.entities.push(s.entities[0]);
 if(bad==='unknown-field')s.entities[0].invented=1;
 assert.throws(()=>P.restorePlanningEmptyLoot(s,r.rooms),e=>e.code==='PLANNING_EMPTY_LOOT_UNSUPPORTED');assert.equal(r.e.drops,old);
});
