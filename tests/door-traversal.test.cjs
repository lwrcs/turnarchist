const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function compile(code,globals={}){const context={exports:{},console:{warn(){}},...globals};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);return context.exports;}
const {findDoorwayOccupant}=compile(fs.readFileSync('src/tile/doorTraversal.ts','utf8'));
function methods(file,names,globals){const s=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const c=s.statements.find(n=>ts.isClassDeclaration(n)&&n.members.some(m=>m.name?.getText(s)===names[0]));return compile('export class Fixture {'+c.members.filter(m=>names.includes(m.name?.getText(s))).map(m=>m.getText(s)).join('\n')+'}',globals).Fixture;}
const Direction={UP:0,DOWN:1,LEFT:2,RIGHT:3},DoorType={DOOR:0,LOCKEDDOOR:1,GUARDEDDOOR:2,TUNNELDOOR:3};
const Door=methods('src/tile/door.ts',['getArrivalPosition','getTraversalTraits','canTraverse','canUnlock','onCollide'],{findDoorwayOccupant,Direction,DoorType});
function doors(){const source=new Door(),target=new Door();
 const a={globalId:'a',roomX:0,entities:[],level:{exitRoom:{}}},b={globalId:'b',roomX:10,entities:[],level:{exitRoom:{}}};
 const game={pushMessage(){}};
 Object.assign(source,{room:a,game,x:4,y:5,z:0,doorDir:Direction.RIGHT,linkedDoor:target,opened:false});
 Object.assign(target,{room:b,game,x:10,y:5,z:0,doorDir:Direction.LEFT,linkedDoor:source,opened:false});
 return {source,target,a,b,player:{x:3,y:5,z:0,w:1,h:1}};
}
test('door traversal rejects occupied source, linked doorway and arrival before opening',()=>{
 for(const where of ['source','linked','arrival']){
  const {source,target,a,b,player}=doors();
  const room=where==='source'?a:b;
  room.entities.push({globalId:'vending',x:where==='source'?4:where==='linked'?10:11,y:5,z:0,w:1,h:1,collidable:true});
  assert.equal(source.canTraverse(player),false);
  source.onCollide(player);assert.equal(source.opened,false);assert.equal(target.opened,false);
  room.entities=[];assert.equal(source.canTraverse(player),true);
 }
});
test('occupancy respects full footprints, layers, dead objects and noncollidable objects',()=>{
 const entity={x:3,y:4,w:2,h:2,z:0,collidable:true};
 assert.equal(findDoorwayOccupant([entity],4,5,0),entity);
 assert.equal(findDoorwayOccupant([entity],5,5,0),undefined);
 assert.equal(findDoorwayOccupant([entity],4,5,1),undefined);
 assert.equal(findDoorwayOccupant([{...entity,dead:true}],4,5,0),undefined);
 assert.equal(findDoorwayOccupant([{...entity,collidable:false}],4,5,0),undefined);
});
test('tunnel descriptor and unlock execution agree about the blocked starting side',()=>{
 const {source,target,player}=doors();
 source.type=DoorType.TUNNELDOOR;source.locked=true;source.startRoom=true;
 assert.equal(source.getTraversalTraits().unlockFromHere,false);assert.equal(source.canUnlock(player),false);
 source.startRoom=false;assert.equal(source.getTraversalTraits().unlockFromHere,true);assert.equal(source.canUnlock(player),true);
 source.room.level.exitRoom.tunnelDoor=target;assert.equal(source.getTraversalTraits().unlockFromHere,false);
 source.locked=false;assert.equal(source.getTraversalTraits().unlocked,true);
});
test('player movement checks the far doorway before moving onto the near doorway',()=>{
 const {source,b,player}=doors();b.entities.push({x:10,y:5,z:0,collidable:true});
 const room=source.room;room.catchUp=()=>{};room.roomArray=[];room.roomArray[4]=[];room.roomArray[4][5]=source;room.isSolidAt=()=>false;
 const Player=methods('src/player/player.ts',['tryMove'],{Door,UpLadder:class{},DownLadder:class{},LevelState:{TRANSITIONING:1,TRANSITIONING_LADDER:2}});
 const p=new Player();Object.assign(p,player,{game:{room,levelState:0,pushMessage(){}},getRoom:()=>room,inventory:{hasWeapon:()=>false},move(){throw new Error('Moved into blocked doorway');}});
 assert.equal(p.tryMove(4,5),false);assert.equal(p.x,3);
});
test('direct game door transition also rejects occupied destination before changing rooms',()=>{
 const {source,target,b,player}=doors();b.entities.push({x:11,y:5,z:0,collidable:true});
 const Game=methods('src/game.ts',['changeLevelThroughDoor'],{}),game=new Game();
 game.changeLevelThroughDoor(player,target,1);
 assert.equal(player.roomGID,undefined);assert.equal(source.room.entered,undefined);
});
