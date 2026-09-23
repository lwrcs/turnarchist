'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.createSourceFile('agentEnvironment.ts',fs.readFileSync('src/game/agentEnvironment.ts','utf8'),ts.ScriptTarget.Latest,true);
const cls=source.statements.find(n=>ts.isClassDeclaration(n)&&n.name.text==='AgentEnvironment');
const method=cls.members.find(n=>n.name?.getText(source)==='restoreSimulationSnapshot').getText(source);
function fixture(){let release;const boot=new Promise(resolve=>{release=resolve;}),events=[];
 const exports={};vm.runInNewContext(ts.transpileModule(`export class Agent {${method}}`,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,
  {exports,AGENT_SIMULATION_MODE:true,WeakMap,parseSaveV2Json:()=>({ok:true,value:{worldSpec:{seed:1}}}),
   loadSaveV2:async()=>{events.push('load');return {ok:true};}});
 const agent=new exports.Agent();Object.assign(agent,{game:{},contacts:new Map(),memory:{clear(){}},observe:()=>({}),
  exclusive:async fn=>fn(),settle:async()=>{await boot;}});
 return {agent,events,release(){events.push('boot');release();}};
}
test('standard Save V2 restore waits for pending world generation BEFORE replacing game collections',async()=>{
 const f=fixture(),pending=f.agent.restoreSimulationSnapshot('{}');let early;
 try{await Promise.resolve();await Promise.resolve();early=[...f.events];}finally{f.release();await pending;}
 assert.deepEqual(early,[]);assert.deepEqual(f.events,['boot','load']);
});
test('standard restore cannot replace the world after a failed readiness barrier',async()=>{
 const f=fixture();f.agent.settle=async()=>{throw new Error('boot failed');};
 await assert.rejects(f.agent.restoreSimulationSnapshot('{}'),/boot failed/);assert.deepEqual(f.events,[]);
});
