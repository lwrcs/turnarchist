const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const warningContext={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/drawable/warningVisibility.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
}).outputText,warningContext);
const context={exports:{},require(name){if(name==='../drawable/warningVisibility')return warningContext.exports;throw new Error(name);}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/game/agentPerception.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020},
}).outputText,context);
const {perceiveRoom,hasTileSight,validateAgentVision,DEFAULT_AGENT_VISION}=context.exports;
const clean=v=>JSON.parse(JSON.stringify(v));
function source() {
  return {player:{x:0,y:0,z:0},tiles:[{x:1,y:0,kind:'Floor'},{x:2,y:0,kind:'Floor'}],
    entities:[{id:'secret-id',kind:'SecretEnemy',x:2,y:0,z:0,isEnemy:true,health:9,combat:{baseDamage:99}}],
    items:[],warnings:[],brightness:()=>0,blocked:()=>false};
}
test('dark contacts expose only position; identification responds to current tile brightness',()=>{
  const input=source();
  const dark=perceiveRoom(input,DEFAULT_AGENT_VISION);
  assert.deepEqual(clean(dark.entities),[{appearance:'unidentified',x:2,y:0,z:0}]);
  assert.equal(dark.tiles[0].kind,null);
  input.brightness=()=>.08;
  const bright=perceiveRoom(input,DEFAULT_AGENT_VISION);
  assert.equal(bright.entities[0].kind,'SecretEnemy');
  assert.equal(bright.entities[0].health,9);
  input.brightness=()=>.079;
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).entities[0].id,undefined);
});
test('range, walls and layer exclude enemies even when lighting is bright',()=>{
  const input=source();input.brightness=()=>1;
  input.entities.push({...input.entities[0],x:13},{...input.entities[0],z:1});
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).entities.length,1);
  input.blocked=(x,y)=>x===1&&y===0;
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).entities.length,0);
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).tiles.length,1);
});
test('sight is symmetric and cannot peek between touching blocked corners',()=>{
  const blocked=(x,y)=>x===1&&y===0;
  assert.equal(hasTileSight(0,0,1,1,blocked),false);
  assert.equal(hasTileSight(1,1,0,0,blocked),false);
  assert.equal(hasTileSight(0,0,1,0,blocked),true);
  assert.equal(hasTileSight(0,0,0,0,blocked),true);
  for(let x=-5;x<=5;x++)for(let y=-5;y<=5;y++) {
    assert.equal(hasTileSight(0,0,x,y,()=>false),true);
  }
});
test('hidden objects and warning source details do not escape restricted perception',()=>{
  const input=source();
  input.entities[0].isEnemy=false;
  input.items=[{x:2,y:0,z:0,name:'treasure'}, {x:2,y:0,z:1,name:'other layer'}];
  input.warnings=[{x:2,y:0,z:0,sourceId:'hidden-boss',sourceX:50,sourceY:50,hostile:true,directionOnly:false}];
  const dark=perceiveRoom(input,DEFAULT_AGENT_VISION);
  assert.equal(dark.entities.length,0);assert.equal(dark.items.length,0);assert.equal(dark.hitWarnings.length,1);
  input.brightness=()=>1;
  const bright=perceiveRoom(input,DEFAULT_AGENT_VISION);
  assert.equal(bright.items.length,1);
  assert.deepEqual(clean(bright.hitWarnings),[{x:2,y:0,z:0,hostile:true,directionOnly:false}]);
});
test('vision settings are validated and copied',()=>{
  for(const vision of [{range:NaN,identificationBrightness:.1},{range:0,identificationBrightness:0},
    {range:12,identificationBrightness:Infinity},{range:12,identificationBrightness:-1}]) {
    assert.throws(()=>validateAgentVision(vision),/Invalid vision/);
  }
  const vision={range:20,identificationBrightness:.2};
  const copied=validateAgentVision(vision);vision.range=1;assert.equal(copied.range,20);
});

test('above-shade warning visibility preserves hostile arrows and nearby friendly X marks in darkness',()=>{
  const visible=warningContext.exports.isWarningVisibleAboveShade;
  assert.equal(visible({x:8,y:0,hostile:true,directionOnly:true},0,0),true);
  assert.equal(visible({x:1,y:1,hostile:false,directionOnly:false},0,0),true);
  assert.equal(visible({x:2,y:0,hostile:false,directionOnly:false},0,0),false);
  assert.equal(visible({x:1,y:0,hostile:false,directionOnly:true},0,0),false);
});

test('warning source identity is available only while its source is identified',()=>{
  const input=source();input.brightness=()=>1;
  input.warnings=[{x:0,y:0,z:0,sourceId:'secret-id',sourceX:2,sourceY:0,hostile:true,directionOnly:false}];
  const known=perceiveRoom(input,DEFAULT_AGENT_VISION).hitWarnings[0];
  assert.equal(known.sourceId,'secret-id');assert.equal(known.sourceX,undefined);
  input.brightness=()=>0;
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).hitWarnings[0].sourceId,undefined);
  input.brightness=()=>1;input.entities[0].x=20;
  assert.equal(perceiveRoom(input,DEFAULT_AGENT_VISION).hitWarnings[0].sourceId,undefined);
});
