'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const Sessions=require('../horizon-smoke-session.js'), V=require('../horizon-validate.cjs');
const report=()=>({schemaVersion:3,seed:1,scenario:'cave',pass:false,status:'RUNNING',phase:'restore-root',results:[{name:'snapshot v3 capability',pass:true}]});
test('operation timeout keeps exact phase, elapsed time and all preceding assertions', async()=>{
 const r=report(), events=[],s=Sessions.create({report:r,onProgress:e=>events.push(e),caseTimeoutMs:1000,operationTimeoutMs:8});
 let error;try{await s.operation('root.restore',()=>new Promise(()=>{}));}catch(e){error=e;}
 const end=s.finish(error);assert.equal(end.error.code,'SMOKE_OPERATION_TIMEOUT');assert.equal(end.error.path,'/smoke/root.restore');
 assert.equal(end.results[0].pass,true);assert.equal(end.phase,'restore-root');assert.equal(end.operations[0].pass,false);assert.ok(events.length>=3);
 assert.ok(end.error.details.elapsedMs>=8);assert.equal(end.completedOperations,0);
});
test('late promise completion cannot turn timeout into a pass or schedule another operation',async()=>{
 const r=report(),s=Sessions.create({report:r,caseTimeoutMs:1000,operationTimeoutMs:5});let resolve,called=false,error;
 try{await s.operation('late',()=>new Promise(r=>resolve=r));}catch(e){error=e;}
 const end=s.finish(error);resolve('too late');await Promise.resolve();
 await assert.rejects(s.operation('forbidden',()=>{called=true;}));assert.equal(called,false);assert.equal(end.pass,false);assert.equal(end.operations.length,1);
});
test('synchronous work exceeding deadline fails even before overdue timer dispatch',async()=>{
 let clock=0;const r=report(),s=Sessions.create({report:r,caseTimeoutMs:1000,operationTimeoutMs:10,clock:()=>clock});let error;
 try{await s.operation('synchronous',()=>{clock=25;return 'would win the old Promise.race';});}catch(e){error=e;}
 assert.equal(s.finish(error).error.code,'SMOKE_OPERATION_TIMEOUT');assert.equal(error.details.elapsedMs,25);
});
test('cumulative deadline is distinguished from one stalled operation',async()=>{
 let clock=0;const r=report(),s=Sessions.create({report:r,caseTimeoutMs:20,operationTimeoutMs:15,clock:()=>clock});
 await s.operation('first',()=>{clock=12;});let error;
 try{await s.operation('second',()=>{clock=25;});}catch(e){error=e;}
 const end=s.finish(error);assert.equal(end.error.code,'SMOKE_CASE_TIMEOUT');assert.equal(end.completedOperations,1);assert.equal(end.operations[0].pass,true);
});
test('external cancellation rejects the active operation and preserves diagnostic evidence',async()=>{
 const c=new AbortController(),r=report(),s=Sessions.create({report:r,signal:c.signal,caseTimeoutMs:1000});
 const pending=s.operation('pending',()=>new Promise(()=>{}));c.abort(new Error('caller abort'));
 let error;try{await pending;}catch(e){error=e;}assert.match(s.finish(error).error.message,/caller abort/);
});
test('progress observers receive detached reports and cannot modify checks',async()=>{
 const r=report(),s=Sessions.create({report:r,onProgress:e=>{e.results[0].pass=false;throw new Error('observer failure');},caseTimeoutMs:1000});
 await s.operation('ok',()=>42);const end=s.finish();assert.equal(end.results[0].pass,true);assert.match(end.observerError,/observer failure/);
});
test('runtime probe is bounded and never invokes getters or game methods',()=>{
 let touched=false;const game={localPlayerID:'local',players:{local:{x:4,y:5,busyAnimating:true,screenMessage:{open:true}}},preLevelGenActionStarted:true};
 Object.defineProperty(game,'room',{get(){touched=true;throw new Error('forbidden');}});
 const value=Sessions.agentStatus({game,busy:true,steps:2,sandboxActionHistory:[{},{}],observe(){throw new Error('forbidden');}});
 assert.equal(touched,false);assert.equal(value['player.x'],4);assert.equal(value.busy,true);assert.equal(value.recordedActions,2);
 assert.ok(!JSON.stringify(value).includes('sandboxActionHistory'));assert.equal(value.preLevelGenActionStarted,true);
});
test('session rejects invalid budgets and disallows overlapping operations',async()=>{
 for(const n of [0,-1,NaN,Infinity,1.5])assert.throws(()=>Sessions.create({report:report(),caseTimeoutMs:n}));
 let resolve;const s=Sessions.create({report:report(),caseTimeoutMs:1000});const p=s.operation('a',()=>new Promise(r=>resolve=r));
 await Promise.resolve();await assert.rejects(s.operation('b',()=>1),/overlap/);resolve();await p;s.finish();
});
test('timeout error summaries retain structured mismatch paths instead of relabelling them',()=>{
 const error=new Error('mismatch');error.code='PLANNING_FINGERPRINT_MISMATCH';error.path='/fingerprint/foo';error.details={expected:'a',actual:'b'};
 assert.deepEqual(Sessions.errorSummary(error).details,error.details);assert.equal(Sessions.errorSummary(error).code,error.code);
});
test('optional case-budget tuning is validated, recorded and does not alter host operation defaults',()=>{
 const os=require('node:os');const out=path.join(os.tmpdir(),'h13-test-report.json');
 assert.equal(V.parseArgs(['--out',out]).caseTimeoutMs,180000);assert.equal(V.parseArgs(['--out',out,'--case-timeout-ms','600000']).caseTimeoutMs,600000);
 for(const bad of ['NaN','0','2.5','1e6','1800001'])assert.throws(()=>V.parseArgs(['--out',out,'--case-timeout-ms',bad]));
 assert.match(fs.readFileSync(path.resolve(__dirname,'../../agent-horizon-host.js'),'utf8'),/stepTimeoutMs = 3000/);
});
test('the smoke page loads its progress module before the smoke implementation',()=>{
 const text=fs.readFileSync(path.resolve(__dirname,'../../horizon-smoke.html'),'utf8');
 assert.ok(text.indexOf('horizon-smoke-session.js')<text.indexOf('horizon-browser-smoke.js'));
});
test('host timeout checks elapsed time after synchronous restore and publishes a classified phase',async()=>{
 let clock=0;const core=require('../../agent-horizon-core.js'), sandbox={module:{exports:{}},require:()=>core,
   performance:{now:()=>clock},setTimeout,clearTimeout,AbortController};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../agent-horizon-host.js'),'utf8'),sandbox);
 const Host=sandbox.module.exports,view={seed:1,scenario:'standard',steps:0,maxSteps:5,ready:true,terminated:false,truncated:false,
  player:{x:0,y:0,z:0},room:{id:'R',depth:0},inventory:[],decision:'world'};
 const make=()=>({observe:()=>structuredClone(view),getPlanningGuard:()=>({stable:true}),getPlanningCapabilities:()=>({snapshotSchemaVersion:3}),
 capturePlanningSnapshot:()=>({schemaVersion:3,source:'privileged-horizon-snapshot',serialized:'{}'}),
 restorePlanningSnapshot:()=>{clock+=21;return Promise.resolve();},stepForPlanning:()=>{throw new Error('must not step');}});
 const live=make(),child=make(),events=[];let disposed=0;
 const simulator={source:()=>live,pending:null,agent:async()=>child,dispose:()=>disposed++};
 const host=Host.create({source:()=>live,simulator,stepTimeoutMs:10,onOperation:e=>events.push(e)});
 const result=await host.plan({kind:'position',roomId:'R',x:1,y:0,z:0});
 assert.equal(result.status,'SIMULATION_UNSUPPORTED');assert.equal(result.error.code,'PLANNING_OPERATION_TIMEOUT');assert.equal(result.error.path,'/simulator/restore');
 assert.ok(events.some(e=>e.phase==='restore'&&e.status==='failed'));assert.ok(disposed>0);
});

test('immutable allocator checkpoint is reused only while its private state is unchanged',()=>{
 const {IdGenerator:I}=require(process.env.HORIZON_ID_MODULE);I.resetForTest();I.generate('R');
 const a=I.captureSimulationState(),text=JSON.stringify(a);assert.equal(I.captureSimulationState(),a);
 assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.reserved));assert.throws(()=>a.reserved.push('bad'));
 I.generate('T');const b=I.captureSimulationState();assert.notEqual(a,b);assert.equal(JSON.stringify(a),text);assert.equal(b.reserved.length,2);
});
test('all successful allocator mutators invalidate or replace its cached checkpoint',()=>{
 const {IdGenerator:I}=require(process.env.HORIZON_ID_MODULE);I.resetForTest();let a=I.captureSimulationState();
 I.reserve('R-existing');let b=I.captureSimulationState();assert.notEqual(a,b);assert.ok(b.reserved.includes('R-existing'));
 I.clearRegistryForLoad();let c=I.captureSimulationState();assert.notEqual(b,c);assert.equal(c.reserved.length,0);assert.equal(c.next,b.next);
 I.generate('E');I.restoreSimulationState(b);let d=I.captureSimulationState();assert.deepEqual(d,b);assert.equal(I.captureSimulationState(),d);
 I.resetForTest();assert.equal(I.captureSimulationState().next,'1');assert.equal(I.captureSimulationState().reserved.length,0);
});
test('failed allocator mutations do not corrupt cached or previously returned mementos',()=>{
 const {IdGenerator:I}=require(process.env.HORIZON_ID_MODULE);I.resetForTest();I.reserve('R-1');const a=I.captureSimulationState();
 assert.throws(()=>I.reserve('R-1'));assert.equal(I.captureSimulationState(),a);
 assert.throws(()=>I.restoreSimulationState({...a,next:'NaN'}));assert.equal(I.captureSimulationState(),a);
 assert.equal(I.generate('R'),'R-2');assert.deepEqual(I.captureSimulationState().reserved,['R-1','R-2']);
});
test('cached checkpoints serialize identically to independent uncached allocator reads after mixed mutations',()=>{
 const {IdGenerator:I,readIdGeneratorSnapshot:read}=require(process.env.HORIZON_ID_MODULE);I.resetForTest();
 for(let n=0;n<100;n++){
   I.generate(n%2?'R':'T');if(n%9===0)I.reserve('saved-'+n);if(n%17===0)I.clearRegistryForLoad();
   const expected=read({format:'id-generator-state-v1',next:I._next.toString(10),reserved:Array.from(I._registry).sort()});
   assert.equal(JSON.stringify(I.captureSimulationState()),JSON.stringify(expected));assert.equal(JSON.stringify(I.captureSimulationState()),JSON.stringify(expected));
 }
});

test('coordinator recovers a partial journal if Python dies without its final report',t=>{
 const os=require('node:os'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'h13-recovery-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'browser.json'),caseDir=file+'.cases/cave-1';fs.mkdirSync(caseDir,{recursive:true});
 const r={seed:1,scenario:'cave',pass:false,phase:'restore-root',results:[{name:'prior proof',pass:true}],operation:{name:'root.restore'}};
 fs.writeFileSync(path.join(caseDir,'progress.jsonl'),JSON.stringify({type:'progress',report:r})+'\n{"partial');
 const restored=V.recoverBrowserReport(file);assert.equal(restored.pass,false);assert.equal(restored.runs[0].phase,'restore-root');
 assert.equal(restored.runs[0].results[0].pass,true);assert.equal(restored.runs[0].error.code,'SMOKE_RUNNER_INCOMPLETE');
 assert.equal(V.browserCoverage(restored).pass,false);
});
test('worker success without supervisor acceptance cannot be recovered as an accepted case',t=>{
 const os=require('node:os'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'h13-recovery-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'browser.json'),caseDir=file+'.cases/standard-1';fs.mkdirSync(caseDir,{recursive:true});
 fs.writeFileSync(path.join(caseDir,'result.json'),JSON.stringify({seed:1,scenario:'standard',pass:true}));
 assert.equal(V.recoverBrowserReport(file).runs[0].pass,false);
});
test('final synchronous verification cannot evade the whole-case deadline',()=>{
 let clock=0;const r=report(),s=Sessions.create({report:r,caseTimeoutMs:10,clock:()=>clock});
 r.pass=true;r.status='PASS';r.phase='complete';clock=15;const end=s.finish();
 assert.equal(end.pass,false);assert.equal(end.error.code,'SMOKE_CASE_TIMEOUT');assert.equal(end.status,'FAIL');
});
