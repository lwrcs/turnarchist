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
