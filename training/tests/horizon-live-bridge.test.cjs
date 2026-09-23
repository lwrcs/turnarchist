'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {LiveHarness,simulationMode}=require(process.env.HORIZON_LIVE_MODULE);
const Core=require('../../agent-horizon-core.js'), Host=require('../../agent-horizon-host.js');
const auth=a=>({guard:Core.canonical(a.getPlanningGuard()),view:Host.viewIdentity(a.observe())});
const right={type:'Move',direction:'right'};
test('live bridge uses exactly one ordinary processor dispatch and measures zero gross loss',async()=>{
 const a=new LiveHarness();const r=await a.stepForHorizon(right,auth(a));
 assert.equal(a.calls.length,1);assert.deepEqual(a.calls[0],{type:'Directional',direction:1,targetX:1,targetY:0});
 assert.equal(r.horizon.healthLoss,0);assert.equal(r.horizon.dispatched,true);assert.equal(a.steps,1);
 assert.equal(a.busy,false);assert.equal(a.horizonDispatch,null);assert.equal(Object.getOwnPropertyDescriptor(a.body,'health').writable,true);
});
test('ordinary evaluator step retains output shape and bypasses opt-in instrumentation',async()=>{
 const a=new LiveHarness();const r=await a.step(right);assert.equal(r.horizon,undefined);assert.equal(r.planning,undefined);assert.equal(a.calls.length,1);
});
test('stale fingerprint rejected at dispatch, not only at wrapper entry; episode not poisoned',async()=>{
 const a=new LiveHarness(),permit=auth(a);a.settleHook=async()=>{a.body.x=4;};
 await assert.rejects(a.stepForHorizon(right,permit),e=>e.code==='HORIZON_STALE_STATE');
 assert.equal(a.calls.length,0);assert.equal(a.steps,0);assert.equal(a.failure,null);assert.equal(a.horizonDispatch,null);
});
test('observation-only drift is rejected even when fingerprint is identical',async()=>{
 const a=new LiveHarness(),permit=auth(a);a.settleHook=async()=>{a.decision='vending';};
 await assert.rejects(a.stepForHorizon(right,permit),e=>e.code==='HORIZON_STALE_STATE');assert.equal(a.calls.length,0);
});
test('cancel while settling prevents dispatch without poisoning or counters',async()=>{
 const a=new LiveHarness(),abort=new AbortController();a.settleHook=async()=>abort.abort();
 await assert.rejects(a.stepForHorizon(right,{...auth(a),signal:abort.signal}),e=>e.code==='HORIZON_CANCELLED');
 assert.equal(a.calls.length,0);assert.equal(a.steps,0);assert.equal(a.failure,null);
});
test('cancel after dispatch does not roll back action or suppress its measurement',async()=>{
 const a=new LiveHarness(),abort=new AbortController();let calls=0;
 a.settleHook=async()=>{if(++calls===2)abort.abort();};
 const r=await a.stepForHorizon(right,{...auth(a),signal:abort.signal});assert.equal(r.info.recorded,true);assert.equal(a.steps,1);assert.equal(r.horizon.dispatched,true);
});
test('live gross metric detects damage followed by healing despite same net health',async()=>{
 const a=new LiveHarness();a.effect=()=>{a.count++;a.body.health--;a.body.health++;};
 const r=await a.stepForHorizon(right,auth(a));assert.equal(r.horizon.healthLoss,1);assert.equal(a.body.health,5);
});
test('missing metric coverage fails closed; ordinary writable descriptor preserved',async()=>{
 const a=new LiveHarness();a.effect=()=>{a.count++;Object.defineProperty(a.body,'health',{value:5,writable:true,configurable:true});};
 await assert.rejects(a.stepForHorizon(right,auth(a)),/invalidated/);assert.equal(a.horizonDispatch,null);
});
test('player replacement leaves outcome unknown, never a fabricated zero',async()=>{
 const a=new LiveHarness();a.effect=()=>{a.count++;a.body={...a.body,health:5};};
 await assert.rejects(a.stepForHorizon(right,auth(a)),/replaced the player/);
});
test('concurrent ordinary or live execution cannot steal the live dispatch permit',async()=>{
 const a=new LiveHarness();let release;let gate=new Promise(r=>release=r);a.settleHook=()=>gate;
 const first=a.stepForHorizon(right,auth(a));await assert.rejects(a.step(right),/progress/);
 await assert.rejects(a.stepForHorizon(right,{guard:'[]',view:'{}'}),/idle/);release();await first;assert.equal(a.calls.length,1);
});
test('pre-aborted call rejects before processor; simulator realm cannot call live API',async()=>{
 const a=new LiveHarness(),abort=new AbortController();abort.abort();
 await assert.rejects(a.stepForHorizon(right,{...auth(a),signal:abort.signal}),e=>e.code==='HORIZON_CANCELLED');
 simulationMode(true);try{await assert.rejects(a.stepForHorizon(right,auth(a)),/non-simulator/);}finally{simulationMode(false);}
 assert.equal(a.calls.length,0);
});
test('action-budget and unsupported-action rejections preserve permit cleanup',async()=>{
 const a=new LiveHarness();a.maxSteps=0;await assert.rejects(a.stepForHorizon(right,auth(a)),/budget/);assert.equal(a.horizonDispatch,null);
 const b=new LiveHarness();await assert.rejects(b.stepForHorizon({type:'Wait'},auth(b)),/Unsupported/);assert.equal(b.calls.length,0);
});
test('live unrecorded action is not retried like simulator inputs',async()=>{
 const a=new LiveHarness();a.effect=()=>{};const r=await a.stepForHorizon(right,auth(a));assert.equal(r.info.recorded,false);assert.equal(a.calls.length,1);
});
test('equal-valued replacement player during settle is rejected BEFORE dispatch',async()=>{
 const a=new LiveHarness(),permit=auth(a);a.settleHook=async()=>{a.body={...a.body};a.game.body=a.body;};
 await assert.rejects(a.stepForHorizon(right,permit),e=>e.code==='HORIZON_STALE_STATE');assert.equal(a.calls.length,0);assert.equal(a.steps,0);
});
test('lightweight goal geometry is read-only and preserves solid/traversal/occupancy facts',()=>{
 const a=new LiveHarness(),original=a.observe.bind(a),tile={z:0,isDoor:true,isSolid:()=>false,getTraversalTraits:()=>({unlocked:false})};
 a.body.getRoom=()=>({globalId:'A',roomArray:{0:{0:tile}},entities:[{x:1,y:0,z:0,w:2,h:1,dead:false,collidable:true}]});
 a.observe=()=>({...original(),room:{...original().room,tiles:[{x:0,y:0,kind:'Door'}]}});
 const before=Host.viewIdentity(a.observe()),data=a.inspectHorizonRoom();assert.equal(data.tiles[0].isDoor,true);assert.equal(data.tiles[0].traversal.unlocked,false);assert.equal(data.occupied[0].width,2);assert.equal(Host.viewIdentity(a.observe()),before);assert.equal(a.calls.length,0);
 a.busy=true;assert.throws(()=>a.inspectHorizonRoom(),/idle/);
});
test('synchronous late settlement cannot overrun the dispatch deadline',async()=>{
 const a=new LiveHarness();a.settleHook=async()=>{const end=performance.now()+5;while(performance.now()<end){}};
 await assert.rejects(a.stepForHorizon(right,{...auth(a),maxDispatchDelayMs:1}),e=>e.code==='HORIZON_CANCELLED');assert.equal(a.calls.length,0);assert.equal(a.failure,null);
});
