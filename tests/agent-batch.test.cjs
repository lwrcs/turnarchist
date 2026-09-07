const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Policy}=require('../agent-baseline.js');
const {Runner}=require('../agent-batch.js');
function view(){return {observationMode:'player-perception',contract:{observationSchemaVersion:3},vision:{range:12,identificationBrightness:.08},
  decision:'world',terminated:false,player:{x:0,y:0,z:0,health:2,maxHealth:2},inventory:[],
  room:{id:'room',tiles:[{x:0,y:-1,solid:false},{x:1,y:0,solid:false},{x:0,y:1,solid:false},{x:-1,y:0,solid:false}],entities:[],hitWarnings:[]}};}
test('baseline rejects diagnostic data and avoids visible warning destinations',()=>{
  const p=new Policy(),v=view();
  assert.throws(()=>p.choose({...v,observationMode:'diagnostic-current-room'}),/restricted/);
  v.room.hitWarnings=[{x:0,y:-1,hostile:true}];
  assert.notEqual(p.choose(v).direction,'up');
});
test('baseline uses traits for healing and combat, and handles ladder choices',()=>{
  const p=new Policy(),v=view();v.player.health=.5;v.inventory=[{slot:7,healingAmount:.5,useTurnCost:0}];
  assert.deepEqual(p.choose(v),{type:'UseItem',slotIndex:7});
  v.inventory=[];v.room.entities=[{x:1,y:0,isEnemy:true,health:1}];
  assert.deepEqual(p.choose(v),{type:'Move',direction:'right'});
  v.decision='ladder';assert.deepEqual(p.choose(v),{type:'LadderConfirm'});
  v.decision='unsupported-modal';assert.equal(p.choose(v),null);
});
test('free successful attacks do not blacklist their direction; unchanged bumps do',()=>{
  const p=new Policy(),v=view();v.room.entities=[{x:1,y:0,isEnemy:true,health:2}];
  const action=p.choose(v),next=structuredClone(v);next.room.entities[0].health=1;
  p.feedback(v,action,next,{turnDelta:0});assert.equal(p.blocked.size,0);
  p.feedback(next,action,next,{turnDelta:0});assert.equal(p.blocked.size,1);
});
function fakeAgent(){
  let state=view(),steps=0,budget=0;const seeds=[];
  return {seeds,async reset(seed,opts){seeds.push(seed);state=view();steps=0;budget=opts.maxSteps;},
    perceive(){return structuredClone(state);},
    async step(action){steps++;state.player.y--;return {
      observation:new Proxy({}, {get(){throw new Error('Policy accessed diagnostic output');}}),
      terminated:false,truncated:steps>=budget,info:{turnDelta:1,recorded:true}};},
    exportReplay(){return {replay:{actions:Array(steps).fill({type:'Wait'})}};}};
}
test('multi-seed runner writes traces/replays and labels budget cutoffs incomplete',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);
  const report=await runner.run({seeds:[123,456],decisions:3});
  assert.deepEqual(agent.seeds,[123,456]);assert.equal(report.runs.length,2);
  for(const run of report.runs){assert.equal(run.status,'budget-incomplete');assert.equal(run.turns,3);
    assert.equal(run.trace.length,3);assert.equal(run.replay.replay.actions.length,3);
    assert.equal(run.trace[0].before.observationMode,'player-perception');}
  assert.equal(runner.running,false);
});
test('cancellation stops between settled actions and preserves the partial replay',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);
  const report=await runner.run({seeds:[1,2],decisions:10,onProgress:()=>runner.stop()});
  assert.equal(report.runs.length,1);assert.equal(report.runs[0].status,'cancelled');
  assert.equal(report.runs[0].decisions,1);assert.equal(report.runs[0].replay.replay.actions.length,1);
});
test('an execution error preserves diagnostics and stops before resetting another seed',async()=>{
  const agent=fakeAgent();agent.step=async()=>{throw new Error('timed out');};
  const runner=new Runner(agent),report=await runner.run({seeds:[1,2],decisions:2});
  assert.equal(report.runs[0].status,'error');assert.deepEqual(agent.seeds,[1]);
  assert.match(report.runs[0].error,/timed out/);assert.equal(runner.running,false);
});
test('input bounds reject before resetting a world',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);
  for(const opts of [{seeds:[]},{seeds:[NaN]},{seeds:[1],decisions:0}])await assert.rejects(runner.run(opts));
  assert.equal(agent.seeds.length,0);
});

test('door transitions incur a remembered crossing cost instead of causing free oscillation',()=>{
  const p=new Policy(),v=view();v.room.tiles[1].isDoor=true;
  const action=p.choose(v);assert.equal(action.direction,'right');
  const next=structuredClone(v);next.room.id='next-room';next.player.x=2;
  p.feedback(v,action,next,{turnDelta:0});
  assert.notEqual(p.choose(v).direction,'right');
});

test('death is separate from budget truncation and trace storage stays bounded',async()=>{
  const agent=fakeAgent(),normal=agent.step;let calls=0;
  agent.step=async action=>{const result=await normal(action);if(++calls===35)result.terminated=true;return result;};
  const report=await new Runner(agent).run({seeds:[1],decisions:40});
  assert.equal(report.runs[0].status,'dead');assert.equal(report.runs[0].trace.length,32);
  assert.equal(report.runs[0].replay.replay.actions.length,35);
});

test('routing follows a previously seen corridor to an exit rather than a local loop',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:1,y:1,solid:false},{x:1,y:2,solid:false,exit:true},{x:-1,y:0,solid:false}];
  p.visits.set('room:1,0',10);p.visits.set('room:1,1',10);
  assert.equal(p.choose(v).direction,'right');
  const unseen=structuredClone(v);unseen.room.tiles=unseen.room.tiles.filter(t=>t.x!==1||t.y!==2);
  assert.equal(p.choose(unseen).direction,'right');
});
test('routing does not use unseen geometry or a blocked starting-side tunnel',()=>{
  const p=new Policy(),v=view();v.room.tiles[0]={x:0,y:-1,solid:true,isDoor:true,traversal:{tunnel:true,unlocked:false,unlockFromHere:false}};
  assert.notEqual(p.choose(v).direction,'up');
  assert.equal(p.maps.get('room').has('100,100'),false);
});


test('used passage cannot retain an unvisited or frontier route reward',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true},
    {x:0,y:1,solid:false},{x:0,y:2,solid:false}];
  p.visits.set('room:0,1',20);
  assert.equal(p.choose(v).direction,'right');
  const next=structuredClone(v);next.room.id='other';next.player.x=2;
  p.feedback(v,{type:'Move',direction:'right'},next,{turnDelta:0});
  // The unused corridor is costly locally, but it still leads to new terrain.
  assert.equal(p.choose(v).direction,'down');
});

test('exhausted route goals yield to local exploration instead of oscillating forever',()=>{
  const p=new Policy(),v=view();
  for(const t of v.room.tiles)p.visits.set(`room:${t.x},${t.y}`,100);
  assert.equal(p.route(v,new Set()),null);
  assert.equal(p.choose(v).type,'Move');
});

test('routing commits to a destination despite a newly attractive competing goal',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},
    {x:2,y:0,solid:false,exit:true},{x:1,y:1,solid:false}];
  assert.equal(p.choose(v).direction,'right');
  v.player.x=1;v.room.items=[{x:1,y:1}];
  p.doorUses.set('room:2,0',1);
  assert.equal(p.choose(v).direction,'right');
  // A newly blocked goal must release the commitment immediately.
  v.room.entities=[{x:2,y:0,collidable:true}];
  assert.equal(p.choose(v).direction,'down');
});

test('weighted routing clears a visible breakable obstruction to reach an exit',()=>{
  const p=new Policy(),v=view();
  v.inventory=[{activeWeapon:true,traits:{baseDamage:1}}];
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:2,y:0,solid:false,exit:true}];
  v.room.entities=[{x:1,y:0,collidable:true,destroyable:true,health:2}];
  assert.equal(p.choose(v).direction,'right');
  const next=structuredClone(v);next.room.entities[0].health=1;
  p.feedback(v,{type:'Move',direction:'right'},next,{turnDelta:1});
  assert.equal(p.choose(next).direction,'right');
  next.room.entities[0].destroyable=false;
  assert.equal(p.route(next,new Set()),null);
});
test('weighted routing prefers an open detour over expensive destruction',()=>{
  const p=new Policy(),v=view();v.inventory=[{activeWeapon:true,traits:{baseDamage:1}}];
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:2,y:0,solid:false,exit:true},
    {x:0,y:1,solid:false},{x:1,y:1,solid:false},{x:2,y:1,solid:false}];
  v.room.entities=[{x:1,y:0,collidable:true,destroyable:true,health:10}];
  assert.equal(p.choose(v).direction,'down');
  v.room.entities[0]={x:1,y:0,appearance:'unidentified'};
  assert.equal(p.route(v,new Set()).direction,'down');
});
