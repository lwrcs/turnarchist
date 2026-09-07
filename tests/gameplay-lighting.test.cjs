const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function compile(code, globals={}) {
  const context={exports:{},...globals};
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
  return context.exports;
}
const lighting=compile(fs.readFileSync('src/lighting/gameplayLighting.ts','utf8'));
class Wall {isInnerWall(){return true;}}
const GameConstants={Z_DEBUG_MODE:false,ENEMIES_BLOCK_LIGHT:true};
const LevelConstants={LIGHTING_MAX_DISTANCE:7,LIGHTING_ANGLE_STEP:2,LIGHTING_ANGLE_BRIGHTNESS_COMPENSATION:1,AMBIENT_LIGHT_COLOR:[125,125,125]};
const {LegacyLighting}=compile(fs.readFileSync('tests/fixtures/legacy-lighting.ts','utf8'),{Wall,GameConstants,LevelConstants});
const clean=value=>JSON.parse(JSON.stringify(value));
function grid(){return Array.from({length:15},()=>Array.from({length:15},()=>[]));}

test('shared rays and RGB mixing exactly match the pre-extraction oracle',()=>{
  for(const debug of [false,true]) for(const blockers of [false,true]) {
    GameConstants.Z_DEBUG_MODE=debug;GameConstants.ENEMIES_BLOCK_LIGHT=blockers;
    const old=new LegacyLighting();
    Object.assign(old,{renderBuffer:grid(),roomArray:Array.from({length:15},()=>Array(15).fill(null)),
      getActiveZ:()=>1,zKey:(x,y)=>`${x},${y}`,zDebugZ1Tiles:new Map([['8,7',new Wall()]]),
      isPositionInRoom:(x,y)=>x>=0&&y>=0&&x<15&&y<15,
      opaqueEntityPositions:new Set(['5,5','5,6','5,7'])});
    old.roomArray[9][7]=new Wall();
    const buffer=grid();
    const context={buffer,maxDistance:7,isPositionInRoom:old.isPositionInRoom,
      isInnerWall:(x,y)=>(debug?old.zDebugZ1Tiles.get(`${x},${y}`)??old.roomArray[x][y]:old.roomArray[x][y]) instanceof Wall,
      opaqueEntityPositions:blockers?old.opaqueEntityPositions:undefined};
    for(const [color,brightness,decay,radius] of [[[125,125,125],5,1,7],[[255,0,50],3,.3,6],[[0,200,255],100,.7,7],[[5,8,10],.01,2,4],[[255,255,255],9,1,0]]) {
      for(let angle=0;angle<360;angle+=2) {
        const args=[angle,7.5,7.5,radius,color,brightness,decay,'cast'];
        old.processTintAtAngle(...args);lighting.processLightRay(context,...args);
      }
    }
    assert.deepEqual(clean(buffer),clean(old.renderBuffer));
    for(let x=0;x<15;x++)for(let y=0;y<15;y++) {
      const rgb=lighting.blendColorsArray(buffer[x][y]);
      assert.deepEqual(clean(rgb),clean(old.blendColorsArray(old.renderBuffer[x][y])));
      assert.equal(lighting.rgbToLuminance(rgb),old.rgbToLuminance(rgb));
    }
    const args=[0,7.5,7.5,7,[125,125,125],5,1,'unCast'];
    old.processTintAtAngle(...args);lighting.processLightRay(context,...args);
    assert.deepEqual(clean(buffer),clean(old.renderBuffer));
  }
});

test('radius zero, room edges, walls and opaque footprints stop rays without DOM access',()=>{
  const buffer=grid();
  const context={buffer,maxDistance:7,isPositionInRoom:(x,y)=>x>=0&&y>=0&&x<15&&y<15,
    isInnerWall:(x,y)=>x===9,opaqueEntityPositions:new Set(['8,8'])};
  lighting.processLightRay(context,0,7.5,7.5,0,[255,255,255],5);
  assert.equal(buffer[7][7].length,0);
  lighting.processLightRay(context,0,7.5,7.5,7,[255,255,255],5);
  assert.equal(buffer[9][7].length,1);
  assert.equal(buffer[10][7].length,0);
  lighting.processLightRay(context,0,7.5,8.5,7,[255,255,255],5);
  assert.equal(buffer[8][8].length,1);
  assert.equal(buffer[9][8].length,0);
  assert.doesNotThrow(()=>lighting.processLightRay(context,180,.5,.5,7,[255,255,255],5));
});

function roomMethods(){
  const source=ts.createSourceFile('room.ts',fs.readFileSync('src/room/room.ts','utf8'),ts.ScriptTarget.Latest,true);
  const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='Room');
  const names=['updateLighting','processTintAtAngle','castTintAtAngle','isGameplayLightWall','getGameplayLightTile'];
  const code=cls.members.filter(m=>names.includes(m.name?.getText(source))).map(m=>m.getText(source)).join('\n');
  return compile(`export class TestRoom {${code}}`,{...lighting,Wall,GameConstants,LevelConstants}).TestRoom;
}
test('occupied-room lighting and opaque blockers are independent of camera visibility',()=>{
  GameConstants.Z_DEBUG_MODE=false;GameConstants.ENEMIES_BLOCK_LIGHT=true;
  GameConstants.DEFAULT_LIGHTING_FOV_DEGREES=360;
  const Room=roomMethods(),room=new Room();
  Object.assign(room,{roomX:0,roomY:0,width:15,height:15,renderBuffer:grid(),vis:grid(),col:grid(),
    roomArray:Array.from({length:15},()=>Array(15).fill(null)),lightSources:[],entities:[{x:8,y:7,opaque:true,w:1,h:1}],
    getActiveZ:()=>0,isPositionInRoom:(x,y)=>x>=0&&y>=0&&x<15&&y<15,
    invalidateBlurCache(){},updateDoorLightSources(){},setLightingAngleStep(){},
    getPlayerLightingFov:()=>360,lastLightingUpdate:0,...{blendColorsArray:lighting.blendColorsArray,rgbToLuminance:lighting.rgbToLuminance}});
  room.game={players:{local:{x:7,y:7,z:0,lightEquipped:false,lightFalloffDecay:1,getRoom:()=>room}}};
  room.onScreen=true;room.isTileOnScreen=()=>true;
  room.updateLighting({x:7,y:7});const visible=clean(room.vis);
  room.onScreen=false;room.isTileOnScreen=()=>false;
  room.updateLighting({x:7,y:7});
  assert.deepEqual(clean(room.vis),visible);
  assert.equal(room.lastLightingUpdate,2);
  assert.equal(room.opaqueEntityPositions.has('8,7'),true);
  room.updateDoorLightSources=()=>{throw new Error('fixture failure');};
  assert.throws(()=>room.updateLighting(),/fixture failure/);
  assert.equal(room.isUpdatingLighting,false);
});
