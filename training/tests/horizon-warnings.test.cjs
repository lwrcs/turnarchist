'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process');
const W=require(process.env.HORIZON_WARNING_MODULE),Codec=require(process.env.HORIZON_HEALTH_MODULE);
const Host=require('../../agent-horizon-host.js'),Core=require('../../agent-horizon-core.js');
const reference=require('./horizon-warning-reference.cjs');
let {HitWarning,observeWarnings}=reference;
const root=path.resolve(__dirname,'../..'),realWarning=path.join(root,'src/drawable/hitWarning.ts'),realTraits=path.join(root,'src/game/agentTraits.ts');
if(fs.existsSync(realWarning)&&fs.existsSync(realTraits)){
 const tsRoot=fs.existsSync(path.join(root,'node_modules/typescript'))?path.join(root,'node_modules/typescript'):
  path.join(cp.execFileSync(process.platform==='win32'?'npm.cmd':'npm',['root','-g'],{encoding:'utf8',shell:process.platform==='win32'}).trim(),'typescript');
 const ts=require(tsRoot);
 function load(file){const exports={},context={exports,require:()=>({Drawable:class Drawable{},Game:class Game{},Utils:{},isWarningVisibleAboveShade:()=>true}),console};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,context,{filename:file});return exports;}
 HitWarning=load(realWarning).HitWarning;observeWarnings=load(realTraits).observeWarnings;
 console.log('Warning tests: actual checkout HitWarning and observation projection');
}else console.log('Warning tests: pinned behavior excerpt; not a complete game');
const canon=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const a={globalId:'R-first',entities:[],hitwarnings:[],doors:[]};
 const b={globalId:'R-second',entities:[{globalId:'E-1',x:7,y:2,z:2,dead:false,unconscious:false,hitWarnings:[]}],hitwarnings:[],doors:[]};
 const game={room:b},e=b.entities[0];
 const active=new HitWarning(game,8,2,7,2,true,false,e),fading=new HitWarning(game,9,2,7,2,true,false,e);fading.tick();
 const environmental=new HitWarning(game,10,2,undefined,undefined,true,false,null);
 b.hitwarnings=[active,fading,environmental];e.hitWarnings=[fading,active];
 return {rooms:[a,b],game,a,b,e,active,fading};
}
function restored(f){const rooms=f.rooms.map(r=>({...r,entities:r.entities.map(e=>({...e,hitWarnings:[]})),hitwarnings:[]}));return {rooms,game:{room:rooms[1]}};}
function apply(v,r,make){return W.restoreWarningContinuation(v,r.rooms,make||((s,p)=>new HitWarning(r.game,s.x,s.y,s.eX,s.eY,s.isEnemy,s.dirOnly,p)));}
const projection=f=>({seed:1,scenario:'standard',steps:5,maxSteps:64,player:{health:2},room:{id:f.b.globalId,hitWarnings:canon(observeWarnings(f.b.hitwarnings))}});
test('reproduces second-room mismatch despite equal position/health with legacy warning restore',()=>{
 const f=fixture(),before=projection(f);f.b.hitwarnings=reference.legacyCopy(f.game,f.b.hitwarnings);
 assert.throws(()=>Host.assertViewIdentity(before,projection(f)),e=>e.code==='PLANNING_OBSERVATION_MISMATCH'&&/hitWarnings/.test(e.path));
});
test('lossless continuation restores source IDs, z, phase, missing coordinates and safety projection',()=>{
 const f=fixture(),saved=W.captureWarningContinuation(f.rooms),r=restored(f);apply(saved,r);
 assert.equal(Core.canonical(canon(observeWarnings(r.rooms[1].hitwarnings))),Core.canonical(canon(observeWarnings(f.b.hitwarnings))));
 assert.equal(r.rooms[1].hitwarnings[2].getSaveFields().eX,undefined);
 assert.equal(r.rooms[1].hitwarnings[0].parent,r.rooms[1].entities[0]);assert.notEqual(r.rooms[1].hitwarnings[0].parent,f.e);
});
test('first empty room, second populated room and backtracking all preserve projections',()=>{
 const f=fixture(),saved=W.captureWarningContinuation(f.rooms),before=Core.canonical(canon(f.rooms.map(r=>observeWarnings(r.hitwarnings))));
 for(let i=0;i<12;i++){const r=restored(f);apply(saved,r);assert.equal(Core.canonical(canon(r.rooms.map(x=>observeWarnings(x.hitwarnings)))),before);}
});
test('shared ownership, order and tick continuation are restored instead of recreated heuristically',()=>{
 const f=fixture(),r=restored(f);apply(W.captureWarningContinuation(f.rooms),r);const b=r.rooms[1];
 assert.equal(b.entities[0].hitWarnings[0],b.hitwarnings[1]);assert.equal(b.entities[0].hitWarnings[1],b.hitwarnings[0]);
 for(let i=0;i<2;i++){
  f.b.hitwarnings.forEach(w=>w.tick());b.hitwarnings.forEach(w=>w.tick());
  assert.equal(Core.canonical(canon(observeWarnings(b.hitwarnings))),Core.canonical(canon(observeWarnings(f.b.hitwarnings))));
 }
});
test('parent death and unconsciousness remain authoritative after restore',()=>{
 const f=fixture(),r=restored(f);apply(W.captureWarningContinuation(f.rooms),r);const b=r.rooms[1];
 b.entities[0].unconscious=true;assert.equal(b.hitwarnings[0].isActive(),false);
 b.entities[0].unconscious=false;b.entities[0].dead=true;assert.equal(b.hitwarnings[0].isActive(),false);
});
test('removed dead zombie remains a shared retired warning source through capture/restore/ticks',()=>{
 const f=fixture();class ZombieEnemy{}Object.setPrototypeOf(f.e,ZombieEnemy.prototype);
 Object.assign(f.e,{dead:true,w:1,h:1});f.b.entities=[];
 const expected=canon(observeWarnings(f.b.hitwarnings)),saved=W.captureWarningContinuation(f.rooms),r=restored(f);
 apply(saved,r);const warnings=r.rooms[1].hitwarnings;
 assert.deepEqual(canon(observeWarnings(warnings)),expected);
 assert.equal(warnings[0].parent,warnings[1].parent);assert.notEqual(warnings[0].parent,f.e);
 assert.equal(warnings[0].isActive(),false);assert.equal(r.rooms[1].entities.length,0);
 const next=W.captureWarningContinuation(r.rooms),again=restored(f);apply(next,again);
 assert.deepEqual(canon(observeWarnings(again.rooms[1].hitwarnings)),expected);
 for(let i=0;i<2;i++){f.b.hitwarnings.forEach(w=>w.tick());warnings.forEach(w=>w.tick());
  assert.deepEqual(canon(observeWarnings(warnings)),canon(observeWarnings(f.b.hitwarnings)));}
});
test('removed dead crab retains the same bounded base-warning parent state',()=>{
 const f=fixture();class CrabEnemy{}Object.setPrototypeOf(f.e,CrabEnemy.prototype);
 Object.assign(f.e,{dead:true,w:1,h:1});f.b.entities=[];
 const expected=canon(observeWarnings(f.b.hitwarnings)),saved=W.captureWarningContinuation(f.rooms),r=restored(f);
 apply(saved,r);assert.deepEqual(canon(observeWarnings(r.rooms[1].hitwarnings)),expected);
 assert.equal(r.rooms[1].hitwarnings[0].parent.constructor.name,'Object');
 assert.equal(r.rooms[1].hitwarnings[0].parent.dead,true);
});
test('removed dead skeleton retains only the audited terminal warning-source state',()=>{
 const f=fixture();class SkullEnemy{}Object.setPrototypeOf(f.e,SkullEnemy.prototype);
 Object.assign(f.e,{dead:true,unconscious:false,w:1,h:1});f.b.entities=[];
 const expected=canon(observeWarnings(f.b.hitwarnings)),saved=W.captureWarningContinuation(f.rooms),r=restored(f);
 assert.equal(saved.retiredParents.sources[0].kind,'SkullEnemy');
 apply(saved,r);const warnings=r.rooms[1].hitwarnings;
 assert.deepEqual(canon(observeWarnings(warnings)),expected);
 assert.equal(warnings[0].parent,warnings[1].parent);
 assert.equal(warnings[0].parent.dead,true);assert.equal(r.rooms[1].entities.length,0);
 const next=W.captureWarningContinuation(r.rooms),again=restored(f);apply(next,again);
 assert.deepEqual(canon(observeWarnings(again.rooms[1].hitwarnings)),expected);
});
test('missing live parents and unaudited dead parent classes still fail closed',()=>{
 const f=fixture();f.b.entities=[];assert.throws(()=>W.captureWarningContinuation(f.rooms),/parent/);
 f.e.dead=true;assert.throws(()=>W.captureWarningContinuation(f.rooms),/parent/);
});
for(const [label,mutate] of [
 ['alive',s=>s.dead=false],['unknown class',s=>s.kind='FrogEnemy'],
 ['nonfinite geometry',s=>s.z=NaN],['empty footprint',s=>s.w=0],
 ['unknown field',s=>s.invented=true],['wrong lifecycle',s=>s.unconscious='false'],
])test('retired source rejects '+label+' before construction',()=>{
 const f=fixture();class ZombieEnemy{}Object.setPrototypeOf(f.e,ZombieEnemy.prototype);
 Object.assign(f.e,{dead:true,w:1,h:1});f.b.entities=[];
 const s=W.captureWarningContinuation(f.rooms);mutate(s.retiredParents.sources[0]);
 let calls=0;assert.throws(()=>apply(s,restored(f),()=>{calls++;}));assert.equal(calls,0);
});
test('retired sources cannot replace a saved live parent or share an ambiguous ID',()=>{
 const f=fixture();class ZombieEnemy{}Object.setPrototypeOf(f.e,ZombieEnemy.prototype);
 Object.assign(f.e,{dead:true,w:1,h:1});f.b.entities=[];
 const s=W.captureWarningContinuation(f.rooms),r=restored(f);r.rooms[0].entities.push({...f.e,dead:false});
 assert.throws(()=>apply(s,r),/collides/);
 s.retiredParents.sources.push({...s.retiredParents.sources[0]});assert.throws(()=>apply(s,restored(f)),/duplicate/);
});
test('capture detaches DTOs and never mutates the live warning graph or RNG',()=>{
 const f=fixture(),before=projection(f),saved=W.captureWarningContinuation(f.rooms);saved.rooms[1].warnings[0].x=100;
 assert.deepEqual(projection(f),before);assert.equal(f.e.hitWarnings[1],f.active);
});
test('constructor overlap checks cannot replace the saved warning tick state',()=>{
 const f=fixture(),r=restored(f);r.game.room.doors.push({x:8,y:2});apply(W.captureWarningContinuation(f.rooms),r);
 assert.equal(r.rooms[1].hitwarnings[0].dead,false);
});
test('invalid parent reference fails before construction or installed-array mutation',()=>{
 const f=fixture(),saved=W.captureWarningContinuation(f.rooms),r=restored(f);saved.rooms[1].warnings[0].parentGid='missing';let calls=0;
 assert.throws(()=>apply(saved,r,()=>{calls++;return {};}),/Saved parent missing/);assert.equal(calls,0);assert.equal(r.rooms[1].hitwarnings.length,0);
});
test('unsupported warning subtype is rejected instead of guessing its gameplay semantics',()=>{
 const f=fixture();class DifferentWarning extends HitWarning{}f.b.hitwarnings.push(new DifferentWarning(f.game,11,2));
 assert.throws(()=>W.captureWarningContinuation(f.rooms),/Unsupported warning class/);
});
for(const [label,mutate] of [
 ['wrong format',s=>s.format='wrong'],['bad phase',s=>s.rooms[1].warnings[0].tickedForDeath='false'],
 ['missing owner',s=>s.rooms[1].owners[0].gid='missing'],['wrong room',s=>s.rooms[1].roomGid='missing'],
 ['invalid index',s=>s.rooms[1].roomWarnings[0]=99],['duplicate room',s=>s.rooms.push(s.rooms[0])],
 ['nonfinite value',s=>s.rooms[1].warnings[0].alpha=NaN],['unknown fields',s=>s.rooms[1].warnings[0].invented=1]
])test('strict validation: '+label,()=>{const f=fixture(),s=W.captureWarningContinuation(f.rooms);mutate(s);assert.throws(()=>apply(s,restored(f)));});
test('accessors in serialized warning data are never executed',()=>{
 let read=false;const v={};Object.defineProperty(v,'format',{enumerable:true,get(){read=true;return W.WARNING_CONTINUATION_FORMAT;}});
 assert.throws(()=>W.readWarningContinuation(v));assert.equal(read,false);
});
test('factory error before commit preserves every destination array',()=>{
 const f=fixture(),r=restored(f),old=r.rooms.map(x=>x.hitwarnings);let calls=0;
 assert.throws(()=>apply(W.captureWarningContinuation(f.rooms),r,(s,p)=>{if(++calls===2)throw new Error('factory');return new HitWarning(r.game,s.x,s.y,s.eX,s.eY,s.isEnemy,s.dirOnly,p);}),/factory/);
 r.rooms.forEach((room,i)=>assert.equal(room.hitwarnings,old[i]));
});
test('observation reporter preserves previous strict equality and identifies exact paths',()=>{
 const a={room:{id:'a',hitWarnings:[{sourceId:'E-1'}]},player:{health:2}},b=structuredClone(a);b.room.hitWarnings[0].sourceId=null;
 assert.throws(()=>Host.assertViewIdentity(a,b,'branch.restore'),e=>e.path==='/observation/room/hitWarnings/0/sourceId'&&e.details.expected==='"E-1"'&&e.details.actual==='null');
 assert.notEqual(Host.viewIdentity(a),Host.viewIdentity(b));Host.assertViewIdentity(a,structuredClone(a));
});
test('errorSummary retains mismatch path, values and operation without a full state dump',()=>{
 let err;try{Host.assertViewIdentity({player:{health:2}},{player:{health:1}});}catch(e){err=e;}
 const report=Core.errorSummary(err);assert.equal(report.path,'/observation/player/health');assert.equal(report.details.expected,'2');assert.equal(report.details.phase,'restore');
 assert.ok(JSON.stringify(report).length<2048);
});
test('existing v3 envelopes continue to parse; new warning data is losslessly nested',()=>{
 const f=fixture(),graph=W.captureWarningContinuation(f.rooms),wire=Codec.planningEncode({warningContinuation:graph});
 assert.deepEqual(Codec.planningDecode(wire).warningContinuation,graph);assert.equal(Codec.PLANNING_CAPABILITIES.snapshotSchemaVersion,3);
});
function liveTwoRoom(repair){
 const {fixture:baseFixture}=require('./horizon-live-fixture.cjs'),Controller=require('../../agent-horizon-controller.js');
 let worlds=new WeakMap();
 const f=baseFixture();
 for(const agent of [f.live,f.child]){
  const fresh=()=>{const w=fixture();w.a.globalId='A';w.b.globalId='B';w.b.hitwarnings=[];w.e.hitWarnings=[];return w;};worlds.set(agent,fresh());
  const observe=agent.observe.bind(agent);agent.observe=function(){this.view.room.hitWarnings=canon(observeWarnings(worlds.get(this)[this.view.room.id==='A'?'a':'b'].hitwarnings));return observe();};
  const advance=agent.advance.bind(agent);agent.advance=async function(action){const before=this.view.room.id,r=await advance(action);
   if(before==='A' && this.view.player.x>=2){this.view.room.id='B';const w=fixture();w.a.globalId='A';w.b.globalId='B';worlds.set(this,w);}
   return r;
  };
  agent.capturePlanningSnapshot=function(){return {schemaVersion:3,source:'privileged-horizon-snapshot',serialized:JSON.stringify(Codec.planningEncode({view:this.observe(),warnings:W.captureWarningContinuation(worlds.get(this).rooms)}))};};
  if(agent===f.child)agent.restorePlanningSnapshot=async function(text){const d=Codec.planningDecode(JSON.parse(text));this.view=d.view;const r=fresh();worlds.set(this,r);apply(d.warnings,r);
   for(const room of r.rooms)room.hitwarnings=reference.legacyCopy(r.game,room.hitwarnings);
   if(repair)apply(d.warnings,r);
  };
 }
 const source=()=>f.live,planner=Host.create({source,simulator:f.simulator,stepTimeoutMs:1000});
 let inside=false,controller;
 controller=Controller.create({source,planner,options:{maxActions:5,intervalMs:0},planOptions:{maxDepth:3,maxMillis:0},
  selector:({view})=>({goal:{kind:view.room.id==='A'?'exit':'position',roomId:view.room.id,x:view.room.id==='A'?2:4,y:0,z:0}}),
  onEvent:(_,e)=>{if(e.type==='executed' && e.from.roomId==='B'){inside=true;controller.stop('second-room-verified');}}});
 return {f,planner,controller,inside:()=>inside};
}
test('end-to-end reproducer: first room succeeds then legacy restore blocks before any second-room action',async()=>{
 const x=liveTwoRoom(false),r=await x.controller.start();
 assert.equal(r.state,'BLOCKED');assert.equal(r.counters.verifiedActions,2);assert.equal(x.inside(),false);
 assert.equal(r.error.code,'PLANNING_OBSERVATION_MISMATCH');assert.match(r.error.path,/hitWarnings/);
 const evidence=x.controller.failureReproduction();assert.equal(evidence.expectedView.room.id,'B');assert.ok(evidence.snapshot.serialized);
 assert.equal(evidence.error.path,r.error.path);assert.equal(r.counters.grossHealthLoss,0);
});
test('end-to-end repair: fresh planning root in populated second room dispatches a verified ordinary action',async()=>{
 const x=liveTwoRoom(true),r=await x.controller.start();
 assert.equal(r.state,'STOPPED',JSON.stringify(r));assert.equal(r.reason,'second-room-verified');assert.equal(x.inside(),true);
 assert.equal(r.counters.verifiedActions,3);assert.equal(r.counters.grossHealthLoss,0);assert.equal(r.error,null);
 assert.equal(x.controller.failureReproduction(),null);
});
test('reproduction export is detached; editing it cannot change the retained failed state',async()=>{
 const x=liveTwoRoom(false);await x.controller.start();const one=x.planner.failureReproduction();one.expectedView.room.id='tampered';
 assert.equal(x.planner.failureReproduction().expectedView.room.id,'B');
});
test('sparse reference lists are rejected rather than installed as partial warning arrays',()=>{
 const f=fixture(),s=W.captureWarningContinuation(f.rooms);delete s.rooms[1].roomWarnings[0];assert.throws(()=>apply(s,restored(f)),/reference/);
});
test('cross-room shared warning objects cannot silently lose their aliasing',()=>{
 const f=fixture();f.a.hitwarnings.push(f.active);assert.throws(()=>W.captureWarningContinuation(f.rooms),/cross-room codec/);
});
for(const enteredOnly of [true,false])test('multi-room acceptance '+(enteredOnly?'rejects entry without a subsequent room-two action':'requires a completed room-two action'),async()=>{
 let step=0;const live={async reset(){step=0;},observe(){return {steps:step,room:{id:'A'}};},getPlanningCapabilities(){return {snapshotSchemaVersion:3,warningContinuation:'horizon-warning-graph-v1'};}};
 const context={AgentHorizonCore:Core,AgentHorizonGoals:{createLocalSelector:()=>()=>null},AgentHorizonController:{create(opts){return {stop(){},dispose(){},failureReproduction(){return null;},async start(){
  const transitions=[{from:{roomId:'A'},to:{roomId:'B'}},...(enteredOnly?[]:[{from:{roomId:'B'},to:{roomId:'B'}}])];
  const report={state:'STOPPED',counters:{actions:transitions.length,verifiedActions:transitions.length,grossHealthLoss:0},options:{maxActions:16,maxRunMillis:60000},planOptions:{maxMillis:2000},error:null};
  for(const t of transitions){step++;opts.onEvent(report,{type:'executed',...t,parity:true,healthLoss:0});}return report;
 }}}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'training/horizon-room-smoke.js'),'utf8'),context);
 const report=await context.AgentHorizonRoomSmoke.run(live);assert.equal(report.pass,!enteredOnly);
});
