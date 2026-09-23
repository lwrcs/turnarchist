'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require(process.env.HORIZON_SPAWNER_MODULE);
class Spawner {
 constructor(id,room,boss=false,table=[1,2,3]) { Object.assign(this,{globalId:id,room,dead:false,enemyTable:table,
  enemySpawnType:table[0],ticks:7,spawnFrequency:12,spawnOffset:4,nextSpawnTick:19,
  seenPlayer:true,heardPlayer:true,aggro:true,buffed:true,skipNextTurns:1,
  status:{poison:{active:true,hitCount:2,startTick:3,effectTick:4},bleed:{active:false,hitCount:0,startTick:0,effectTick:0}},isBossEnemy:boss}); }
}
function fixture(boss=true,table=[29]) { const room={globalId:'R-boss',entities:[]};
 const spawner=new Spawner('EN-boss',room,boss,table);room.entities=[spawner];return {rooms:[room],spawner}; }
const supported=e=>e instanceof Spawner;
test('boss spawner continuation restores its random pool, cadence, and boss observation flag',()=>{
 const live=fixture(true,[29]),loaded=fixture(false,[1,2,3]);
 const saved=P.capturePlanningSpawners(live.rooms,supported);
 P.restorePlanningSpawners(saved,loaded.rooms,supported);
 for(const key of ['enemyTable','enemySpawnType','ticks','spawnFrequency','spawnOffset','nextSpawnTick','seenPlayer','heardPlayer','aggro','buffed','skipNextTurns','status','isBossEnemy'])
  assert.deepEqual(loaded.spawner[key],live.spawner[key],key);
});
test('adjacent-hit spawner continuation preserves the fingerprinted skip/status state',()=>{
 const live=fixture(),loaded=fixture();loaded.spawner.skipNextTurns=0;loaded.spawner.heardPlayer=false;
 loaded.spawner.aggro=false;loaded.spawner.buffed=false;loaded.spawner.status.poison.active=false;
 const saved=P.capturePlanningSpawners(live.rooms,supported);P.restorePlanningSpawners(saved,loaded.rooms,supported);
 for(const key of ['skipNextTurns','heardPlayer','aggro','buffed','status']) assert.deepEqual(loaded.spawner[key],live.spawner[key],key);
});
test('fresh spawner preserves the runtime distinction between unset and false buff state',()=>{
 const live=fixture(),loaded=fixture();delete live.spawner.buffed;loaded.spawner.buffed=false;
 const saved=P.capturePlanningSpawners(live.rooms,supported);P.restorePlanningSpawners(saved,loaded.rooms,supported);
 assert.equal(loaded.spawner.buffed,undefined);
});
test('spawner restore rejects a forged or incomplete set before mutation',()=>{
 const live=fixture(),loaded=fixture(false,[1]),saved=P.capturePlanningSpawners(live.rooms,supported),before={...loaded.spawner,enemyTable:[...loaded.spawner.enemyTable]};
 saved.entities[0].enemyTable=[29,'bad'];
 assert.throws(()=>P.restorePlanningSpawners(saved,loaded.rooms,supported),e=>e.code==='PLANNING_SPAWNER_CONTINUATION_UNSUPPORTED');
 assert.deepEqual(loaded.spawner.enemyTable,before.enemyTable);assert.equal(loaded.spawner.isBossEnemy,before.isBossEnemy);
});
