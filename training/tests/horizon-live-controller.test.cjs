'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./horizon-live-fixture.cjs'), C=require('../../agent-horizon-controller.js'),G=require('../../agent-horizon-goals.js'),Core=require('../../agent-horizon-core.js');
test('controller repeatedly replans and commits only one witnessed ordinary action',async()=>{
 const f=fixture(),r=await f.controller.start({goal:f.goal});assert.equal(r.state,'COMPLETED');assert.equal(r.counters.actions,3);assert.equal(r.counters.queries,3);assert.equal(r.counters.verifiedActions,3);assert.equal(f.live.view.player.x,3);assert.equal(r.counters.grossHealthLoss,0);
 assert.equal(r.counters.simulations,f.counts().simulations);assert.equal(f.counts().executions,3);assert.ok(!JSON.stringify(r).includes('rootGuard'));assert.ok(!JSON.stringify(r).includes('privileged-horizon-snapshot'));
});
test('depth-one verified prefixes are executable without calling them full solutions',async()=>{
 const f=fixture({planOptions:{maxDepth:1}}),r=await f.controller.start({goal:f.goal});assert.equal(r.state,'COMPLETED');assert.equal(r.counters.actions,3);assert.ok(r.events.some(e=>e.type==='verified-plan'&&e.status==='SAFE_PREFIX_FOUND'));
});
test('automatic explicit local goals continue until bounded action budget',async()=>{
 const f=fixture({controllerOptions:{maxActions:3}}),r=await f.controller.start();assert.equal(r.reason,'action-budget');assert.equal(r.counters.verifiedActions,3);assert.ok(r.events.some(e=>e.type==='goal'));
});
test('unsafe candidates never produce a live action; no net-HP fallback',async()=>{
 const f=fixture({simEffect:(_,a,r)=>{if(r.info.recorded)r.metric.healthLoss=1;}}),r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'no-safe-prefix');assert.equal(r.counters.dispatches,0);
});
test('stop in verified-plan event cancels before any live dispatch',async()=>{
 let f;f=fixture({onEvent:(_,e)=>{if(e.type==='verified-plan')f.controller.stop();}});const r=await f.controller.start({goal:f.goal});assert.equal(r.state,'STOPPED');assert.equal(f.counts().executions,0);
});
test('stale result after observer invalidation is discarded and manual goal is preserved',async()=>{
 let f,changed=false;f=fixture({onEvent:(_,e)=>{if(e.type==='verified-plan'&&!changed){changed=true;f.live.view.player.x=1;}}});
 const r=await f.controller.start({goal:f.goal});assert.equal(r.state,'COMPLETED');assert.equal(r.counters.invalidations,1);assert.equal(f.live.view.player.x,3);assert.equal(r.counters.actions,2);
});
test('state drift during search replans instead of executing stale result',async()=>{
 let f,changed=false;f=fixture({simEffect:()=>{if(!changed){changed=true;f.live.view.player.x=1;}}});const r=await f.controller.start({goal:f.goal});assert.equal(r.state,'COMPLETED');assert.equal(r.counters.invalidations,1);
});
test('repeated invalidations stop at the explicit total bound',async()=>{
 let f;f=fixture({controllerOptions:{maxInvalidations:1},onEvent:(_,e)=>{if(e.type==='verified-plan')f.live.view.player.y=(f.live.view.player.y+1)%3;}});const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'HORIZON_INVALIDATION_BUDGET');assert.equal(r.counters.dispatches,0);
});
test('live divergence stops immediately without executing remaining suffix or reverting world',async()=>{
 const f=fixture({liveEffect:a=>{a.view.player.y=1;}}),r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'HORIZON_EXECUTION_DIVERGED');assert.equal(r.counters.actions,1);assert.equal(r.counters.verifiedActions,0);assert.equal(f.live.view.player.y,1);
});
test('live damage then healing is a safety failure even on cancellation',async()=>{
 let f;f=fixture({liveEffect:(_,a,r)=>{r.metric.healthLoss=1;f.controller.stop();}});const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'HORIZON_SAFETY_VIOLATION');assert.equal(r.counters.grossHealthLoss,1);assert.equal(r.counters.actions,1);
});
test('cancelling an admitted live action waits for settlement and issues no second action',async()=>{
 let f;f=fixture({liveEffect:async()=>{f.controller.stop();await new Promise(r=>setTimeout(r,5));}});const r=await f.controller.start({goal:f.goal});assert.equal(r.state,'STOPPED');assert.equal(r.counters.verifiedActions,1);assert.equal(r.lastTransition.parity,true);
});
test('unknown live timeout quarantines source and prevents unsafe restart by another controller',async()=>{
 const f=fixture({controllerOptions:{liveActionTimeoutMs:10},liveEffect:()=>new Promise(()=>{})});const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'HORIZON_LIVE_ACTION_TIMEOUT');assert.equal(r.quarantined,true);await assert.rejects(f.controller.start(),/HORIZON_RELOAD_REQUIRED/);
 const second=C.create({source:f.source,planner:f.planner});await assert.rejects(second.start(),/owns/);
});
test('controller-owned deadline stops even a planner ignoring cancellation',async()=>{
 const f=fixture();const planner={planForExecution:()=>new Promise(()=>{}),cancel(){}};
 const c=C.create({source:f.source,planner,options:{maxRunMillis:15,intervalMs:0}});const r=await c.start({goal:f.goal});assert.equal(r.state,'BUDGET_EXHAUSTED');assert.equal(r.counters.dispatches,0);
});
test('late synchronous search completion beyond run deadline cannot authorize a live action',async()=>{
 const f=fixture();const plan=f.planner.planForExecution;const p={...f.planner,async planForExecution(...args){const r=await plan(...args);const until=performance.now()+30;while(performance.now()<until){}return r;}};
 const c=C.create({source:f.source,planner:p,options:{maxRunMillis:20,intervalMs:0}});const r=await c.start({goal:f.goal});assert.equal(r.counters.dispatches,0);
});
test('forged or inconsistent action witness cannot execute',async()=>{
 const f=fixture(),original=f.planner.planForExecution;const planner={...f.planner,async planForExecution(...args){const r=await original(...args);r.execution.action.direction='left';return r;}};
 const c=C.create({source:f.source,planner});const r=await c.start({goal:f.goal});assert.equal(r.reason,'HORIZON_UNVERIFIED_RESULT');assert.equal(f.counts().executions,0);
});
test('initialization is explicit: construction and snapshot never step or plan',()=>{
 const f=fixture();assert.equal(f.controller.snapshot().state,'IDLE');assert.deepEqual(f.counts(),{simulations:0,executions:0,disposals:0});
});
test('simultaneous starts/controllers cannot share a live source lease',async()=>{
 const f=fixture();const first=f.controller.start({goal:f.goal});await assert.rejects(f.controller.start(),/HORIZON_BUSY/);
 const other=C.create({source:f.source,planner:f.planner});await assert.rejects(other.start(),/owns/);await first;
});
test('settings changes during planning halt instead of silently relabeling evaluations',async()=>{
 let f;f=fixture({simEffect:()=>{f.live.view.contract.settings='changed';}});const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'HORIZON_EPISODE_CHANGED');assert.equal(f.counts().executions,0);
});
test('zero action/query/simulation budgets issue no live actions',async()=>{
 for(const k of ['maxActions','maxQueries','maxSimulations']){const f=fixture({controllerOptions:{[k]:0}}),r=await f.controller.start({goal:f.goal});assert.equal(r.state,'BUDGET_EXHAUSTED');assert.equal(f.counts().executions,0);}
});
test('one-action button discards a longer suffix',async()=>{
 const f=fixture();const r=await f.controller.start({goal:f.goal,singleAction:true});assert.equal(r.counters.actions,1);assert.equal(f.live.view.player.x,1);
});
test('already reached explicit goal returns completion with zero executed actions',async()=>{
 const f=fixture();f.goal.x=0;const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'goal-reached');assert.equal(r.counters.actions,0);
});
test('empty-prefix budget cutoff is unknown, never permission to make up a move',async()=>{
 const f=fixture({planOptions:{maxSimulations:0}});const r=await f.controller.start({goal:f.goal});assert.equal(r.reason,'no-safe-prefix');assert.equal(f.counts().executions,0);
});
test('bounded diagnostics evict old events, never keep privileged execution tokens',async()=>{
 const f=fixture({controllerOptions:{maxEvents:4}}),r=await f.controller.start({goal:f.goal});assert.equal(r.events.length,4);assert.ok(r.droppedEvents>0);assert.ok(!JSON.stringify(r).includes('afterGuard'));
});
test('ordinary host results are unchanged; execution evidence costs no additional simulations',async()=>{
 const f=fixture();const ordinary=await f.planner.plan(f.goal,{maxDepth:2});assert.equal(ordinary.execution,undefined);
 const count=f.counts().simulations;const exec=await f.planner.planForExecution(f.goal,{maxDepth:2});assert.equal(exec.execution.source,'horizon-first-edge-v1');assert.equal(exec.stats.simulations,f.counts().simulations-count);assert.equal(exec.execution.rootGuard,Core.canonical(f.live.getPlanningGuard()));
});
test('first-edge evidence respects memory reservation and refuses missing proof',async()=>{
 const f=fixture();const r=await f.planner.planForExecution(f.goal,{maxBytes:100});assert.equal(r.execution,null);assert.equal(r.status,'SEARCH_BUDGET_EXHAUSTED');
});
test('goal selector is deterministic, bounded and does not cross exit tiles',()=>{
 const select=G.createLocalSelector({radius:2,maxExpanded:20}),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();geometry.tiles.find(t=>t.x===2&&t.y===0).exit=true;
 const a=select({view,geometry});assert.deepEqual(a,select({view,geometry}));assert.equal(a.goal.kind,'exit');assert.equal(a.goal.x,2);assert.ok(a.expanded<=20);
});
test('goal selector honors occupied tiles and refuses unsupported geometry',()=>{
 const select=G.createLocalSelector(),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();geometry.occupied=[{x:1,y:0,z:0,width:8,height:3},{x:0,y:1,z:0,width:1,height:2}];
 assert.equal(select({view,geometry}),null);assert.throws(()=>select({view,geometry:{...geometry,roomId:'wrong'}}));
});
test('standing ladder becomes explicit exit; locked unavailable exit is not selected',()=>{
 const select=G.createLocalSelector(),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();view.decision='ladder';geometry.tiles[0].exit=true;
 assert.equal(select({view,geometry}).goal.kind,'exit');geometry.tiles[0].traversal={unlocked:false};assert.notEqual(select({view,geometry}).goal.kind,'exit');
});
test('standing on an inactive arrival ladder chooses only one step away before return',()=>{
 const select=G.createLocalSelector(),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();
 view.decision='world';geometry.tiles[0].exit=true;geometry.tiles[0].solid=false;
 const chosen=select({view,geometry});assert.equal(chosen.label,'Step off the arrival ladder before returning');
 assert.equal(Math.abs(chosen.goal.x-view.player.x)+Math.abs(chosen.goal.y-view.player.y),1);
});
test('a reachable traversal outranks aimless room wandering even when it is the arrival door',()=>{
 const select=G.createLocalSelector({radius:2,maxExpanded:20}),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();
 const door=geometry.tiles.find(t=>t.x===1&&t.y===0);door.exit=true;door.solid=false;
 const visits={};for(const k of G.arrivalExitKeys({view,geometry}))visits[k]=1;
 const chosen=select({view,geometry,visits});
 assert.equal(G.goalKey(chosen.goal),G.goalKey({kind:'exit',roomId:view.room.id,x:1,y:0,z:0}));
});
test('automatic goals prefer the least-used passage and rank distant routes by their exit',()=>{
 const select=G.createLocalSelector({radius:2,maxExpanded:40}),f=fixture(),view=f.live.observe(),geometry=f.live.inspectHorizonRoom();
 const near=geometry.tiles.find(t=>t.x===1&&t.y===0),far=geometry.tiles.find(t=>t.x===4&&t.y===0);
 near.exit=far.exit=true;near.solid=far.solid=false;
 const visits={[G.key(view.room.id,near.x,near.y,0)]:3,[G.key(view.room.id,2,0,0)]:99};
 const chosen=select({view,geometry,visits});
 assert.equal(chosen.goal.kind,'position');assert.equal(chosen.goal.roomId,view.room.id);
 assert.equal(Math.abs(chosen.goal.x-view.player.x)+Math.abs(chosen.goal.y-view.player.y),2);
});
test('controller and sequence validators reject unknown/unbounded/wait configurations',()=>{
 assert.throws(()=>C.optionsFor({foo:1}));assert.throws(()=>C.optionsFor({maxRunMillis:0}));assert.throws(()=>C.optionsFor({maxEvents:1001}));assert.throws(()=>G.createLocalSelector({radius:0}));
 assert.throws(()=>C.selectSequence({schemaVersion:1,policy:'unsafe',status:'GOAL_REACHED',plan:{actions:[]}}));
});
test('divergence diagnostics point to a field and preserve expected/actual values',async()=>{
 const f=fixture({liveEffect:a=>{a.view.player.y=1;}}),r=await f.controller.start({goal:f.goal});
 assert.equal(r.error.path,'/observation/player/y');assert.equal(r.error.details.expected,'0');assert.equal(r.error.details.actual,'1');assert.equal(r.quarantined,true);
});
test('a synchronous observer overrunning the run deadline cannot admit a live action',async()=>{
 const f=fixture({controllerOptions:{maxRunMillis:30},onEvent:(_,e)=>{if(e.type==='verified-plan'){const end=performance.now()+35;while(performance.now()<end){}}}});
 const r=await f.controller.start({goal:f.goal});assert.equal(r.counters.dispatches,0);assert.equal(r.state,'BUDGET_EXHAUSTED');
});
