const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const context={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/game/agentMemory.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
test('recognition keeps traits but never refreshes hidden combat state or invents invisible contacts',()=>{
  const memory=new context.exports.AgentMemory();
  const entity={id:'a',x:1,y:1,appearance:'identified',kind:'Zombie',health:3,forwardOnlyAttack:true,facing:{dx:1,dy:0},combat:{killDamageThreshold:3}};
  memory.remember('room',{entities:[entity],tiles:[]});
  const result=memory.remember('room',{entities:[{id:'a',x:2,y:1,appearance:'unidentified'}],tiles:[]}).entities[0];
  assert.equal(result.kind,'Zombie');assert.equal(result.x,2);assert.equal(result.forwardOnlyAttack,true);
  assert.equal(result.health,null);assert.equal(result.facing,null);assert.equal(result.combat.killDamageThreshold,null);
  assert.equal(memory.remember('room',{entities:[],tiles:[]}).entities.length,0);
  memory.clear();assert.equal(memory.remember('room',{entities:[{id:'a',appearance:'unidentified'}],tiles:[]}).entities[0].kind,undefined);
});
test('terrain memory is room-specific and current light refreshes changed geometry',()=>{
  const memory=new context.exports.AgentMemory();
  memory.remember('a',{entities:[],tiles:[{x:1,y:1,appearance:'identified',solid:true,kind:'Wall'}]});
  const dark=()=>({entities:[],tiles:[{x:1,y:1,appearance:'unidentified',solid:null,kind:null}]});
  assert.equal(memory.remember('a',dark()).tiles[0].solid,true);
  assert.equal(memory.remember('b',dark()).tiles[0].solid,null);
  memory.remember('a',{entities:[],tiles:[{x:1,y:1,appearance:'identified',solid:false,kind:'Floor'}]});
  assert.equal(memory.remember('a',dark()).tiles[0].solid,false);
});
