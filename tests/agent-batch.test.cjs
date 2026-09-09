const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Policy}=require('../agent-baseline.js');

test('an enclosed programmed agent never invents an unrestricted Wait', () => {
  const p=new Policy(),v=view();
  for(const tile of v.room.tiles)tile.solid=true;
  assert.equal(p.choose(v),null);
});
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
    extendBudget(n){budget+=n;},
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

test('attacking from a warned tile loses to a known safe escape regardless of visits',()=>{
  const p=new Policy(),v=view();v.room.hitWarnings=[{x:0,y:0,hostile:true}];
  v.room.entities=[{x:1,y:0,isEnemy:true,collidable:true,health:2}];
  for(const t of v.room.tiles)p.visits.set(`room:${t.x},${t.y}`,1000);
  assert.notEqual(p.choose(v).direction,'right');
  assert.equal(p.inspect().reason,'evade-warning');
});
test('clearing an obstacle on a route cannot override escaping a current warning',()=>{
  const p=new Policy(),v=view();v.inventory=[{activeWeapon:true,traits:{baseDamage:1}}];
  v.room.tiles[1].exit=true;v.room.entities=[{x:1,y:0,collidable:true,destroyable:true,health:1}];
  v.room.hitWarnings=[{x:0,y:0,hostile:true}];
  assert.notEqual(p.choose(v).direction,'right');
});

test('batch metrics preserve zero-turn chains and report earlier stalls and health loss',async()=>{
  const agent=fakeAgent();let v=view(),n=0;
  agent.perceive=()=>structuredClone(v);
  agent.step=async()=>{n++;if(n===3){v.player.x=1;v.player.health=1;}
    return {info:{recorded:true,turnDelta:n===3?1:0},terminated:false,truncated:n===3};};
  const report=await new Runner(agent).run({seeds:[1],decisions:3});
  const r=report.runs[0];assert.equal(r.zeroTurnDecisions,2);assert.equal(r.maxZeroTurnStreak,2);
  assert.equal(r.maxDecisionsWithoutNewPosition,1);assert.equal(r.decisionsSinceNewPosition,0);
  assert.equal(r.healthLost,1);assert.equal(r.status,'budget-incomplete');
  assert.ok(r.trace.every(t=>t.policy.reason));assert.equal(report.schemaVersion,4);
});

test('a known killing blow cancels only warnings from the killed source',()=>{
  const p=new Policy(),v=view();
  v.inventory=[{activeWeapon:true,traits:{attackPattern:'adjacent-cardinal',minimumAttackDamage:1}}];
  v.room.entities=[{id:'target',x:1,y:0,isEnemy:true,collidable:true,destroyable:true,
    health:1,combat:{killDamageThreshold:1}}];
  v.room.hitWarnings=[{x:0,y:0,hostile:true,sourceId:'target'}];
  assert.equal(p.choose(v).direction,'right');
  v.room.hitWarnings.push({x:0,y:0,hostile:true,sourceId:'other'});
  assert.notEqual(p.choose(v).direction,'right');
  v.room.hitWarnings.pop();v.room.entities[0].combat.killDamageThreshold=2;
  assert.notEqual(p.choose(v).direction,'right');
  v.room.entities[0].combat.killDamageThreshold=null;
  assert.notEqual(p.choose(v).direction,'right');
});

test('pushing an object is not assumed to escape a warning when an empty tile is available',()=>{
  const p=new Policy(),v=view();v.room.hitWarnings=[{x:0,y:0,hostile:true}];
  v.room.entities=[{x:1,y:0,collidable:true,destroyable:true,pushable:true,health:1}];
  p.visits.set('room:0,-1',1000);p.visits.set('room:0,1',1000);p.visits.set('room:-1,0',1000);
  assert.notEqual(p.choose(v).direction,'right');
});

test('push escape requires a visible clear tail and supports chain-pushable occupants',()=>{
  const p=new Policy(),v=view();
  v.room.tiles.push({x:2,y:0,solid:false},{x:3,y:0,solid:false});
  v.room.entities=[{x:1,y:0,pushable:true,collidable:true},{x:2,y:0,chainPushable:true,collidable:true}];
  assert.equal(p.canPushIntoSpace(v,1,0,1,0),true);
  v.room.tiles.find(t=>t.x===3).solid=null;
  assert.equal(p.canPushIntoSpace(v,1,0,1,0),false);
  v.room.tiles.find(t=>t.x===3).solid=false;v.room.entities[1].chainPushable=false;
  assert.equal(p.canPushIntoSpace(v,1,0,1,0),false);
});
test('a confirmed push can escape a current warning while a blocked push cannot',()=>{
  const p=new Policy(),v=view();v.room.hitWarnings=[{x:0,y:0,hostile:true}];
  v.room.tiles.push({x:2,y:0,solid:false});
  v.room.entities=[{x:1,y:0,pushable:true,collidable:true}];
  for(const t of v.room.tiles)if(t.x!==1)p.visits.set(`room:${t.x},${t.y}`,100);
  assert.equal(p.choose(v).direction,'right');
  v.room.tiles.find(t=>t.x===2).solid=true;
  assert.notEqual(p.choose(v).direction,'right');
});
test('routing does not pass through the far edge of a wide collider',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:2,y:0,solid:false,exit:true}];
  v.room.entities=[{x:1,y:-1,width:1,height:2,collidable:true,destroyable:false}];
  assert.equal(p.route(v,new Set()),null);
});

test('a distant reachable goal stays eligible after every nearby tile was explored',()=>{
  const p=new Policy(),v=view();v.room.tiles=[];
  for(let x=0;x<=30;x++){v.room.tiles.push({x,y:0,solid:false});if(x<30)p.visits.set(`room:${x},0`,50);}
  assert.equal(p.route(v,new Set()).direction,'right');
  assert.equal(p.goal.key,'30,0');
});
test('an occluded remembered blocker stays blocked until its location is seen clear',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:2,y:0,solid:false,exit:true}];
  v.room.entities=[{id:'machine',x:1,y:0,isEnemy:false,collidable:true,destroyable:false}];
  assert.equal(p.route(v,new Set()),null);
  v.room.entities=[];v.room.tiles=v.room.tiles.filter(t=>t.x!==1);
  assert.equal(p.route(v,new Set()),null);
  v.room.tiles.push({x:1,y:0,solid:false});
  assert.equal(p.route(v,new Set()).direction,'right');
});
test('a remembered obstacle moving to a visible new position does not block its old cell',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false},{x:2,y:0,solid:false,exit:true}];
  v.room.entities=[{id:'object',x:1,y:0,isEnemy:false,collidable:true,destroyable:false}];p.route(v,new Set());
  v.room.entities[0].y=1;assert.equal(p.route(v,new Set()).direction,'right');
});

test('resuming preserves the action sequence and replay without resetting the seed',async()=>{
  const one=fakeAgent(),split=fakeAgent();
  const full=await new Runner(one).run({seeds:[123],decisions:8});
  const runner=new Runner(split);await runner.run({seeds:[123],decisions:3});
  const resumed=await runner.resumeLast({decisions:5});
  assert.deepEqual(split.seeds,[123]);assert.equal(resumed.runs[0].decisions,8);
  assert.equal(resumed.runs[0].replay.replay.actions.length,8);
  assert.deepEqual(resumed.runs[0].trace.map(t=>t.action),full.runs[0].trace.map(t=>t.action));
  assert.equal(resumed.runs[0].decisionBudget,8);assert.equal(resumed.runs[0].resumptions.length,1);
});
test('resume rejects manual state changes and invalid budgets before extending',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);await runner.run({seeds:[1],decisions:2});
  let extensions=0;agent.extendBudget=()=>{extensions++;};
  await assert.rejects(runner.resumeLast({decisions:0}),/decisions/);
  const original=agent.perceive;agent.perceive=()=>{const v=original();v.player.health=1;return v;};
  await assert.rejects(runner.resumeLast(),/game changed/);assert.equal(extensions,0);
});
test('cancelled runs can resume but an execution failure cannot',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);
  await runner.run({seeds:[1,2],decisions:5,onProgress:()=>runner.stop()});
  const resumed=await runner.resumeLast({decisions:2});assert.deepEqual(agent.seeds,[1]);
  assert.equal(resumed.runs[0].decisions,3);assert.equal(resumed.runs[0].status,'budget-incomplete');
  agent.step=async()=>{throw new Error('failure');};await runner.resumeLast({decisions:1});
  await assert.rejects(runner.resumeLast(),/No resumable/);
});

test('resume rejects replay-history changes even if the visible state is unchanged',async()=>{
  const agent=fakeAgent(),runner=new Runner(agent);await runner.run({seeds:[1],decisions:2});
  agent.exportReplay=()=>({replay:{actions:[]}});
  await assert.rejects(runner.resumeLast(),/Replay history changed/);
});

test('an exhausted room backtracks through a used door to remembered unfinished work',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true}];
  p.visits.set('room:1,0',50);p.doorUses.set('room:1,0',1);
  p.connect('room','1,0','earlier');p.roomWork.set('earlier',true);
  assert.equal(p.choose(v).direction,'right');assert.equal(p.inspect().reason,'backtrack');
  assert.equal(p.goal.targetRoom,'earlier');
  p.roomWork.set('earlier',false);assert.equal(p.route(v,new Set()),null);
});
test('backtracking finds work through exhausted rooms without cycling or inventing links',()=>{
  const p=new Policy();p.connect('a','1,0','b');p.connect('b','2,0','a');p.connect('b','3,0','c');
  p.roomWork.set('c',true);
  const first={key:'1,0',action:{type:'Move',direction:'right'}};
  assert.equal(p.backtrack('a',[first]).targetRoom,'c');
  assert.equal(p.backtrack('a',[]),null);
  p.roomWork.set('c',false);assert.equal(p.backtrack('a',[first]),null);
});
test('crossings learn directed connections without guessing return doors',()=>{
  const p=new Policy(),v=view(),next=view();v.room.tiles[1].isDoor=true;next.room.id='next';next.player.x=10;
  next.room.tiles=[{x:9,y:0,solid:false,isDoor:true}];
  p.feedback(v,{type:'Move',direction:'right'},next,{turnDelta:0});
  assert.equal(p.connections.get('room').get('1,0'),'next');
  assert.equal(p.connections.has('next'),false);
  assert.equal(p.doorUses.has('next:9,0'),false);
  next.room.id='ambiguous';next.room.tiles.push({x:11,y:0,isDoor:true});
  p.feedback(v,{type:'Move',direction:'right'},next,{turnDelta:0});
  assert.equal(p.connections.has('ambiguous'),false);
});

test('a dead-end visit returns to the earlier room and takes its unfinished branch',()=>{
  const p=new Policy(),a=view(),b=view();a.room.id='a';b.room.id='b';b.player.x=10;
  a.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true},
    {x:-1,y:0,solid:false},{x:-2,y:0,solid:false,isDoor:true}];
  b.room.tiles=[{x:10,y:0,solid:false},{x:9,y:0,solid:false,isDoor:true}];
  const enter=p.choose(a);assert.equal(enter.direction,'right');
  p.feedback(a,enter,b,{turnDelta:0});
  const returnAction=p.choose(b);assert.equal(returnAction.direction,'left');
  assert.equal(p.inspect().reason,'route');
  p.feedback(b,returnAction,a,{turnDelta:0});
  assert.equal(p.choose(a).direction,'left');assert.equal(p.goal.key,'-2,0');
});
test('remembered blocked intermediate passages are excluded from room backtracking',()=>{
  const p=new Policy();p.connect('a','1,0','b');p.connect('b','2,0','c');p.roomWork.set('c',true);
  p.obstacles.set('b',new Map([['wall',{x:2,y:0,collidable:true,destroyable:false}]]));
  assert.equal(p.backtrack('a',[{key:'1,0'}]),null);
});

test('a non-door room transition cannot invent a reverse door link',()=>{
  const p=new Policy(),v=view(),next=view();next.room.id='fall-destination';next.player.x=10;
  next.room.tiles=[{x:9,y:0,isDoor:true}];
  p.feedback(v,{type:'Move',direction:'right'},next,{turnDelta:1});
  assert.equal(p.connections.has('fall-destination'),false);
});

test('local exploration takes priority over remembered work in another room',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true},{x:-1,y:0,solid:false}];
  p.doorUses.set('room:1,0',1);p.connect('room','1,0','earlier');p.roomWork.set('earlier',true);
  assert.equal(p.choose(v).direction,'left');assert.equal(p.inspect().reason,'route');
});
test('backtracking cannot route through a currently threatened departure door',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true}];
  p.doorUses.set('room:1,0',1);p.connect('room','1,0','earlier');p.roomWork.set('earlier',true);
  assert.equal(p.route(v,new Set(['1,0'])),null);
});
test('backtracking excludes remembered locked start-side tunnel links',()=>{
  const p=new Policy();p.connect('a','1,0','b');p.connect('b','2,0','c');p.roomWork.set('c',true);
  p.maps.set('b',new Map([['2,0',{isDoor:true,traversal:{tunnel:true,unlocked:false,unlockFromHere:false}}]]));
  assert.equal(p.backtrack('a',[{key:'1,0'}]),null);
  p.maps.get('b').get('2,0').traversal.unlocked=true;
  assert.equal(p.backtrack('a',[{key:'1,0'}]).targetRoom,'c');
});

test('routing diagnostics distinguish known blocked passages from unseen topology',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,isDoor:true},
    {x:-1,y:0,solid:false,isDoor:true,traversal:{tunnel:true,unlocked:false,unlockFromHere:false}}];
  v.room.entities=[{id:'blocker',x:1,y:0,isEnemy:false,collidable:true,destroyable:false}];
  p.choose(v);
  const diagnostic=p.inspect().navigation;
  assert.equal(diagnostic.knownTiles,3);assert.equal(diagnostic.reachableTiles,1);
  assert.equal(diagnostic.passages.length,2);
  assert.equal(diagnostic.passages.find(d=>d.key==='1,0').blockers[0].id,'blocker');
  assert.equal(diagnostic.passages.every(d=>d.destination===null&&!d.reachable),true);
  assert.equal(diagnostic.passages.find(d=>d.key==='-1,0').traversal.unlockFromHere,false);
});

test('return ladders are deferred until local exploration is exhausted',()=>{
  const p=new Policy(),v=view();
  v.room.tiles=[{x:0,y:0,solid:false},{x:1,y:0,solid:false,exit:true,
    traversal:{kind:'ladder',direction:'up',unlocked:true}},{x:-1,y:0,solid:false}];
  assert.equal(p.choose(v).direction,'left');
  p.goal=null;p.visits.set('room:-1,0',50);
  assert.equal(p.choose(v).direction,'right');assert.equal(p.goal.key,'1,0');
  p.goal=null;p.doorUses.set('room:1,0',1);
  assert.equal(p.route(v,new Set()),null);
});
test('locked or threatened return ladders are not usable routes',()=>{
  const p=new Policy(),v=view();v.room.tiles=[{x:0,y:0,solid:false},
    {x:1,y:0,solid:false,exit:true,traversal:{kind:'ladder',direction:'up',unlocked:false}}];
  assert.equal(p.route(v,new Set()),null);
  v.room.tiles[1].traversal.unlocked=true;
  assert.equal(p.route(v,new Set(['1,0'])),null);
});
test('ladder confirmation and return crossings teach directed room connections',()=>{
  const p=new Policy(),v=view(),next=view();v.room.tiles=[{x:0,y:0,solid:false,exit:true}];
  next.room.id='side-area';p.feedback(v,{type:'LadderConfirm'},next,{turnDelta:0});
  assert.equal(p.connections.get('room').get('0,0'),'side-area');
  assert.equal(p.doorUses.get('room:0,0'),1);
  next.room.tiles=[{x:1,y:0,solid:false,exit:true,traversal:{direction:'up',unlocked:true}}];
  p.feedback(next,{type:'Move',direction:'right'},v,{turnDelta:0});
  assert.equal(p.connections.get('side-area').get('1,0'),'room');
  p.roomWork.set('room',true);p.doorUses.set('side-area:1,0',2);
  assert.equal(p.choose(next).direction,'right');assert.equal(p.inspect().reason,'backtrack');
});

test('retreat from a giant prefers visible maneuvering space over a wall pocket',()=>{
  const p=new Policy(),v=view();v.player={x:10,y:14,health:.5,maxHealth:2};
  v.room.tiles=[];for(let x=8;x<=12;x++)for(let y=12;y<=17;y++)
    v.room.tiles.push({x,y,solid:y===12,kind:y===12?'Wall':'Floor'});
  v.room.entities=[{id:'giant',x:10,y:15,width:2,height:2,isEnemy:true,collidable:true,destroyable:true,health:4},
    {id:'bush',x:9,y:13,isEnemy:false,collidable:true,destroyable:true,health:1}];
  v.room.hitWarnings=[{x:10,y:14,hostile:true,sourceId:'giant'},{x:11,y:14,hostile:true,sourceId:'giant'}];
  assert.equal(p.choose(v).direction,'left');
  assert.equal(p.escapeSpace(v,10,13,new Set(['10,14','11,14'])),1);
});
test('all four giant tiles are attacks that stay on the current warning unless lethal',()=>{
  for(const [x,y,px,py,direction] of [[1,1,1,0,'down'],[2,1,2,0,'down'],[1,2,0,2,'right'],[2,2,3,2,'left']]) {
    const p=new Policy(),v=view();v.player={x:px,y:py,health:2,maxHealth:2};
    v.room.tiles=[];for(let tx=-1;tx<=4;tx++)for(let ty=-1;ty<=4;ty++)v.room.tiles.push({x:tx,y:ty,solid:false});
    v.inventory=[{activeWeapon:true,traits:{attackPattern:'adjacent-cardinal',minimumAttackDamage:1,baseDamage:1}}];
    v.room.entities=[{id:'giant',x:1,y:1,width:2,height:2,isEnemy:true,collidable:true,destroyable:true,health:4,combat:{killDamageThreshold:4}}];
    v.room.hitWarnings=[{x:px,y:py,hostile:true,sourceId:'giant'}];
    assert.notEqual(p.choose(v).direction,direction,`nonlethal attack at ${x},${y}`);
    v.room.entities[0].health=1;v.room.entities[0].combat.killDamageThreshold=1;
    for(const t of v.room.tiles)if(Math.abs(t.x-px)+Math.abs(t.y-py)===1&&!(t.x===x&&t.y===y))
      v.room.hitWarnings.push({x:t.x,y:t.y,hostile:true,sourceId:'other'});
    assert.equal(p.choose(v).direction,direction,`lethal attack at ${x},${y}`);
  }
});

test('batch reset preserves the selected combat scenario in report and reset options',async()=>{
  const agent=fakeAgent(),original=agent.reset;let options;
  agent.reset=async(seed,opts)=>{options=opts;return original(seed,opts);};
  const report=await new Runner(agent).run({seeds:[123],decisions:2,scenario:'combat-bigskull'});
  assert.equal(options.scenario,'combat-bigskull');assert.equal(report.scenario,'combat-bigskull');
});


test('encounter clear stops on the final hit even at the decision budget and cannot resume',async()=>{
  const agent=fakeAgent(),step=agent.step;agent.step=async action=>{const r=await step(action);r.info.encounterCleared=true;return r;};
  const runner=new Runner(agent);const report=await runner.run({seeds:[1],decisions:1,scenario:'combat-skull'});
  assert.equal(report.runs[0].status,'encounter-cleared');assert.equal(report.runs[0].replay.replay.actions.length,1);
  await assert.rejects(()=>runner.resumeLast(),/No resumable/);
});

test('death takes priority over an inconsistent clear flag',async()=>{
  const agent=fakeAgent(),step=agent.step;agent.step=async action=>{const r=await step(action);r.terminated=true;r.info.encounterCleared=true;return r;};
  const report=await new Runner(agent).run({seeds:[1],decisions:3,scenario:'combat-skull'});
  assert.equal(report.runs[0].status,'dead');assert.equal(report.runs[0].decisions,1);
});


test('equal-space retreats favor leaving an identified threatening giant lane',()=>{
  const p=new Policy(),v=view();v.player={x:12,y:12,health:2,maxHealth:2};v.room.tiles=[];
  for(let x=10;x<=15;x++)for(let y=10;y<=16;y++)v.room.tiles.push({x,y,solid:x===10||y===10});
  v.room.entities=[{id:'giant',x:12,y:13,width:2,height:2,isEnemy:true,collidable:true,destroyable:true,health:3},
    {id:'bush',x:11,y:11,isEnemy:false,collidable:true,destroyable:true,health:1}];
  v.room.hitWarnings=[{x:12,y:12,hostile:true,sourceId:'giant'},{x:13,y:12,hostile:true,sourceId:'giant'}];
  assert.equal(p.choose(v).direction,'left');
  assert.equal(p.leavesThreatLane(v,11,12),1);assert.equal(p.leavesThreatLane(v,12,11),0);
  v.room.hitWarnings.forEach(w=>delete w.sourceId);assert.equal(p.leavesThreatLane(v,11,12),0);
});


test('safe guaranteed finishes beat explored-tile penalties and exits, even without a warning',()=>{
 const p=new Policy(),v=view();
 v.inventory=[{activeWeapon:true,traits:{attackPattern:'adjacent-cardinal',minimumAttackDamage:1}}];
 v.room.entities=[{id:'recovering',x:1,y:0,isEnemy:true,destroyable:true,health:1,combat:{killDamageThreshold:1}}];
 v.room.tiles.find(t=>t.x===0&&t.y===-1).exit=true;
 p.visits.set('room:1,0',100);
 assert.equal(p.choose(v).direction,'right');
 // Another source still threatens the player's tile: finishing is unsafe.
 v.room.hitWarnings=[{x:0,y:0,hostile:true,sourceId:'other'}];
 assert.notEqual(p.choose(v).direction,'right');
});

test('prepares a blocked perpendicular escape before a surviving side hit',()=>{
 const p=new Policy(),v=view();v.player={x:13,y:12,health:2,maxHealth:2};
 v.room.tiles=[];for(let x=10;x<=16;x++)for(let y=10;y<=15;y++)v.room.tiles.push({x,y,solid:false});
 v.inventory=[{activeWeapon:true,traits:{attackPattern:'adjacent-cardinal',minimumAttackDamage:1}}];
 v.room.entities=[{id:'enemy',x:11,y:12,width:2,height:2,isEnemy:true,collidable:true,destroyable:true,health:4,combat:{killDamageThreshold:4}},
 {id:'clutter',x:13,y:11,width:1,height:1,isEnemy:false,collidable:true,destroyable:true,health:1,combat:{killDamageThreshold:1}}];
 v.room.hitWarnings=[{x:11,y:11,hostile:true,sourceId:'enemy'}];
 assert.equal(p.choose(v).direction,'up');assert.equal(p.reason,'clear-combat-escape');
 v.room.entities.push({id:'recovering',x:14,y:12,isEnemy:true,destroyable:true,combat:{killDamageThreshold:1}});
 assert.equal(p.prepareCombatEscape(v,new Set()),null);
 v.room.entities.pop();
 // Unknown or multi-hit clearance cannot promise an exit next turn.
 v.room.entities[1].combat.killDamageThreshold=null;
 assert.notEqual(p.prepareCombatEscape(v,new Set())?.direction,'up');
 v.room.entities[1].combat.killDamageThreshold=2;
 assert.notEqual(p.prepareCombatEscape(v,new Set())?.direction,'up');
 v.room.entities[1].combat.killDamageThreshold=1;
 assert.equal(p.prepareCombatEscape(v,new Set(['13,12'])),null);
 // Finish a killable enemy instead; an unthreatening recovering enemy also needs no prep.
 v.room.entities[0].combat.killDamageThreshold=1;
 assert.equal(p.prepareCombatEscape(v,new Set()),null);
 v.room.entities[0].combat.killDamageThreshold=4;v.room.hitWarnings=[];
 assert.equal(p.prepareCombatEscape(v,new Set()),null);
});


test('shifts along a wide enemy edge when the other enemy covers the direct dodge',()=>{
 const p=new Policy(),v=view();v.player={x:13,y:11,health:1,maxHealth:2};
 v.room.tiles=[];for(let x=10;x<=17;x++)for(let y=9;y<=15;y++)v.room.tiles.push({x,y,solid:false});
 v.inventory=[{activeWeapon:true,traits:{attackPattern:'adjacent-cardinal',minimumAttackDamage:1}}];
 v.room.entities=[{id:'giant',x:12,y:12,width:2,height:2,isEnemy:true,collidable:true,destroyable:true,combat:{killDamageThreshold:4}},
 {id:'support',x:15,y:11,width:1,height:1,isEnemy:true,collidable:true,destroyable:true,combat:{killDamageThreshold:2}}];
 v.room.hitWarnings=[{x:14,y:12,hostile:true,sourceId:'giant'},{x:14,y:11,hostile:true,sourceId:'support'}];
 assert.equal(p.choose(v).direction,'left');
 // A hidden or warned second step is not a promised escape.
 v.room.tiles=v.room.tiles.filter(t=>t.x!==11||t.y!==11);
 assert.equal(p.prepareCombatEscape(v,new Set(['14,11'])),null);
});
