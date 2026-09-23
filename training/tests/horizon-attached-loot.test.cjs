'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require(process.env.HORIZON_ATTACHED_LOOT_MODULE);
class Shrooms {
  constructor(room,x,y,gid){Object.assign(this,{level:room,x,y,z:0,globalId:gid,stackCount:1,pickedUp:false});}
  onDrop(){} autoPickup(){}
}
class Mushrooms {
  constructor(room,gid,dropGid){Object.assign(this,{room,globalId:gid,x:9,y:4,z:0,w:1,h:1,dead:false,
    lootDropped:false,drops:[new Shrooms(room,9,4,dropGid)]});}
  release(){for(const drop of this.drops){drop.level=this.room;this.room.items.push(drop);drop.onDrop();drop.autoPickup();}this.lootDropped=true;}
}
function fixture(dropGid){const room={globalId:'R-g9',entities:[],items:[]},entity=new Mushrooms(room,'EN-mushroom',dropGid);
 room.entities=[entity];return {room,entity,rooms:[room]};}
const saveItem=item=>({kind:'mushrooms',gid:item.globalId,x:item.x,y:item.y,stackCount:item.stackCount,pickedUp:item.pickedUp});
const spawnItem=(saved,room)=>new Shrooms(room,saved.x,saved.y,saved.gid);

test('guaranteed mushroom drop exposes restored attached-item identity mismatch',()=>{
 const live=fixture('IT-live'),loaded=fixture('IT-rerolled');live.entity.release();loaded.entity.release();
 assert.notEqual(loaded.room.items[0].globalId,live.room.items[0].globalId);
});
test('attached loot continuation preserves identity when the real owner releases it',()=>{
 const live=fixture('IT-live'),loaded=fixture('IT-rerolled');
 const saved=P.capturePlanningAttachedLoot(live.rooms,saveItem);
 P.restorePlanningAttachedLoot(saved,loaded.rooms,spawnItem);live.entity.release();loaded.entity.release();
 assert.deepEqual(loaded.room.items.map(saveItem),live.room.items.map(saveItem));
 assert.equal(loaded.entity.lootDropped,true);
});
test('released chest loot keeps the Save V2 world-item reference instead of a detached copy',()=>{
 const live=fixture('IT-live');live.entity.release();
 const saved=P.capturePlanningAttachedLoot(live.rooms,saveItem);
 assert.equal(saved.entities.length,1);
 assert.deepEqual(saved.entities[0].drops,[]);
 const loaded=fixture('IT-rerolled'),worldDrop=new Shrooms(loaded.room,9,4,'IT-live');
 loaded.room.items=[worldDrop];loaded.entity.drops=[worldDrop];loaded.entity.lootDropped=false;
 P.restorePlanningAttachedLoot(saved,loaded.rooms,spawnItem);
 assert.equal(loaded.entity.drops[0],loaded.room.items[0]);
 assert.equal(loaded.entity.lootDropped,true);
});
test('mixed world and attached loot appends the continuation without replacing world references',()=>{
 const live=fixture('IT-attached'),worldDrop=new Shrooms(live.room,9,4,'IT-world');
 live.room.items=[worldDrop];live.entity.drops=[worldDrop,live.entity.drops[0]];
 const saved=P.capturePlanningAttachedLoot(live.rooms,saveItem);
 const loaded=fixture('IT-rerolled'),loadedWorld=new Shrooms(loaded.room,9,4,'IT-world');
 loaded.room.items=[loadedWorld];loaded.entity.drops=[loadedWorld];
 P.restorePlanningAttachedLoot(saved,loaded.rooms,spawnItem);
 assert.equal(loaded.entity.drops[0],loadedWorld);
 assert.deepEqual(loaded.entity.drops.map(d=>d.globalId),['IT-world','IT-attached']);
});
for(const bad of ['owner','class','drop-id','duplicate-owner','duplicate-drop','unknown-field'])
test('attached-loot malformed input is rejected before owner mutation: '+bad,()=>{
 const live=fixture('IT-live'),loaded=fixture('IT-rerolled'),saved=P.capturePlanningAttachedLoot(live.rooms,saveItem),old=loaded.entity.drops;
 if(bad==='owner')saved.entities[0].gid='missing';
 if(bad==='class')saved.entities[0].kind='Wrong';
 if(bad==='drop-id')saved.entities[0].drops[0].gid='';
 if(bad==='duplicate-owner')saved.entities.push(saved.entities[0]);
 if(bad==='duplicate-drop')saved.entities[0].drops.push(saved.entities[0].drops[0]);
 if(bad==='unknown-field')saved.entities[0].invented=1;
 assert.throws(()=>P.restorePlanningAttachedLoot(saved,loaded.rooms,spawnItem),e=>e.code==='PLANNING_ATTACHED_LOOT_UNSUPPORTED');
 assert.equal(loaded.entity.drops,old);
});
