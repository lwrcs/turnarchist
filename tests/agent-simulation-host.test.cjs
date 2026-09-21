const {test} = require('node:test');
const assert = require('node:assert/strict');
const host = require('../agent-simulation-host.js');

test('isolated simulator restores a snapshot, steps only the child, and summarizes the outcome', async () => {
  let liveSteps = 0;
  const liveView = {player:{x:1,y:1,z:0,health:2,mana:1,coins:3,turnCount:8},room:{id:'live',depth:0,entities:[],hitWarnings:[]}};
  const live = {
    observe: () => liveView,
    captureSimulationSnapshot: () => ({serialized:'{"worldSpec":{"seed":12}}'}),
    step: () => { liveSteps++; },
  };
  let restored = null;
  let childView = {player:{x:1,y:1,z:0,health:2,mana:1,coins:3,turnCount:8},room:{id:'live',depth:0,
    entities:[{id:'z1',isEnemy:true,health:1}],hitWarnings:[{dangerous:true}]}};
  const child = {
    restoreSimulationSnapshot: async raw => { restored = raw; },
    observe: () => childView,
    step: async action => {
      assert.deepEqual(action, {type:'Move',direction:'left'});
      childView = {player:{x:0,y:1,z:0,health:2,mana:1,coins:3,turnCount:9},room:{id:'live',depth:0,entities:[],hitWarnings:[]}};
      return {terminated:false,truncated:false,info:{recorded:true,turnDelta:1}};
    },
  };
  const simulator = new host.IsolatedSimulator({source: () => live, createFrame: () => ({contentWindow:{agent:child}})});
  const result = await simulator.simulate({type:'Move',direction:'left'});
  assert.equal(restored, '{"worldSpec":{"seed":12}}');
  assert.equal(liveSteps, 0);
  assert.deepEqual(result.action, {type:'Move',direction:'left'});
  assert.deepEqual(result.enemiesKilled, ['z1']);
  assert.equal(result.playerDelta.turnCount, 1);
  assert.equal(result.threatsAfter, 0);
});

test('preview rejects a child branch if the visible game changed', async () => {
  const liveView = {player:{x:1,y:1,z:0,health:2,mana:1,coins:0,turnCount:0},room:{id:'live',depth:0,entities:[],hitWarnings:[]}};
  const live = {observe: () => liveView, captureSimulationSnapshot: () => ({serialized:'{}'})};
  const child = {restoreSimulationSnapshot: async () => {}, observe: () => liveView, step: async () => {
    liveView.player.health = 1;
    return {terminated:false,truncated:false,info:{}};
  }};
  const simulator = new host.IsolatedSimulator({source: () => live, createFrame: () => ({contentWindow:{agent:child}})});
  await assert.rejects(simulator.simulate({type:'Move',direction:'up'}), /changed the live game/);
});

test('candidate evaluator ranks a threat-removing branch ahead of a harmless loop', async () => {
  const liveView = {player:{x:1,y:1,z:0,health:2,mana:1,coins:0,turnCount:0},room:{id:'live',depth:0,entities:[],hitWarnings:[]}};
  const live = {observe: () => liveView, captureSimulationSnapshot: () => ({serialized:'{}'})};
  let childView = liveView;
  const child = {
    restoreSimulationSnapshot: async () => { childView = liveView; },
    observe: () => childView,
    step: async action => {
      childView = action.direction === 'right'
        ? {player:{...liveView.player,turnCount:1},room:{...liveView.room,entities:[],hitWarnings:[]}}
        : {player:{...liveView.player,turnCount:1},room:{...liveView.room,entities:[],hitWarnings:[{dangerous:true}]}};
      return {terminated:false,truncated:false,info:{recorded:true,turnDelta:1}};
    },
  };
  const simulator = new host.IsolatedSimulator({source: () => live, createFrame: () => ({contentWindow:{agent:child}})});
  const report = await simulator.evaluateCandidates([
    {id:'move_left',action:{type:'Move',direction:'left'}},
    {id:'move_right',action:{type:'Move',direction:'right'}},
  ]);
  assert.equal(report.selected.id, 'move_right');
  assert.deepEqual(report.ranked.map(row => row.id), ['move_right','move_left']);
});

test('candidate builder excludes locked ladders and empty solid walls', () => {
  const candidates = host.candidateActions({tactical:{moves:[
    {direction:'up',resolution:'ladder',traversal:{unlocked:false,unlockableFromHere:false}},
    {direction:'right',resolution:'blocked-or-interact',occupantId:null},
    {direction:'down',resolution:'blocked-or-interact',occupantId:'wall-torch'},
    {direction:'left',resolution:'move'},
  ]}});
  assert.deepEqual(candidates.map(candidate => candidate.id), ['move_down','move_left']);
});

test('candidate builder excludes impossible guarded doors but keeps unlockable traversals', () => {
  const candidates = host.candidateActions({tactical:{moves:[
    {direction:'up',resolution:'door-transition-or-door-interaction',traversal:{unlocked:false}},
    {direction:'right',resolution:'door-transition-or-door-interaction',traversal:{unlocked:false,unlockableFromHere:true}},
    {direction:'down',resolution:'door-transition-or-door-interaction',traversal:{unlocked:false,unlockFromHere:true}},
  ]}});
  assert.deepEqual(candidates.map(candidate => candidate.id), ['move_right','move_down']);
});

test('changing rooms does not report the previous room enemies as killed', async () => {
  const before = {player:{x:4,y:4,z:0,health:2,mana:1,coins:0,turnCount:5},room:{id:'room-a',depth:0,
    entities:[{id:'z1',kind:'Zombie',isEnemy:true,health:1},{id:'s1',kind:'Skull',isEnemy:true,health:1}],hitWarnings:[]}};
  const after = {player:{x:1,y:4,z:0,health:2,mana:1,coins:0,turnCount:6},room:{id:'room-b',depth:0,
    entities:[],hitWarnings:[{dangerous:true,directionOnly:false},{dangerous:true,directionOnly:true}]}};
  const live = {observe:()=>before,captureSimulationSnapshot:()=>({serialized:'{}'})};
  const child = {restoreSimulationSnapshot:async()=>{},observe:()=>before,step:async()=>({terminated:false,truncated:false,
    info:{recorded:true,turnDelta:1}})};
  child.step = async () => { child.observe = () => after; return {terminated:false,truncated:false,info:{recorded:true,turnDelta:1}}; };
  const outcome = await new host.IsolatedSimulator({source:()=>live,createFrame:()=>({contentWindow:{agent:child}})})
    .simulate({type:'Move',direction:'right'});
  assert.equal(outcome.transition, 'room');
  assert.deepEqual(outcome.enemiesKilled, []);
  assert.equal(outcome.threatsAfter, 1);
  assert.match(host.describeOutcome({outcome}), /enters another room; new room has 1 active damaging warning/);
});

test('ladder previews state the destination and confirmation availability', () => {
  const text = host.describeOutcome({preview:{resolution:'ladder',traversal:{direction:'down',sidePath:true}},outcome:{
    playerDelta:{positionChanged:true}, playerAfter:{x:4,y:5}, decisionAfter:'ladder', recorded:true, threatsAfter:0,
  }});
  assert.equal(text, 'moves onto sidepath down ladder; confirmation interface available');
});

test('destroying a block is reported as destruction without player movement', async () => {
  const before = {player:{x:4,y:4,z:0,health:2,mana:1,coins:0,turnCount:5},room:{id:'room-a',depth:0,
    entities:[{id:'b1',kind:'Block',isEnemy:false,health:1}],hitWarnings:[]}};
  const after = {player:{x:4,y:4,z:0,health:2,mana:1,coins:0,turnCount:6},room:{id:'room-a',depth:0,
    entities:[],hitWarnings:[]}};
  const live = {observe:()=>before,captureSimulationSnapshot:()=>({serialized:'{}'})};
  const child = {restoreSimulationSnapshot:async()=>{},observe:()=>before};
  child.step = async () => { child.observe = () => after; return {terminated:false,truncated:false,info:{recorded:true,turnDelta:1}}; };
  const outcome = await new host.IsolatedSimulator({source:()=>live,createFrame:()=>({contentWindow:{agent:child}})})
    .simulate({type:'Move',direction:'up'});
  assert.equal(outcome.playerDelta.positionChanged, false);
  assert.deepEqual(outcome.objectsDestroyed, [{id:'b1',kind:'Block'}]);
  assert.equal(host.describeOutcome({outcome}), 'destroys block and stays in place');
});

test('goal-aware evaluation prefers the safe move with the shorter traversal route', () => {
  const context = {stateVisits:new Map(),roomVisits:new Map([['room-a',1]]),previousRoomId:null,entryGoalIds:new Map()};
  const outcome = distance => ({status:'settled',recorded:true,transition:null,threatsAfter:0,
    playerDelta:{health:0,positionChanged:true,roomChanged:false,depthChanged:false},
    playerAfter:{x:1,y:1},roomAfter:{id:'room-a',depth:0},decisionAfter:null,
    enemiesKilled:[],enemiesDamaged:[],operatorAfter:{pathfinding:{pointsOfInterest:[
      {kind:'door',traversal:{unlocked:true},route:{reachable:true,steps:Array.from({length:distance},()=>({}))}},
    ]}}});
  const left = {id:'move_left',outcome:outcome(3)};
  const down = {id:'move_down',outcome:outcome(5)};
  left.evaluation = host.evaluateOutcome(left,context);
  down.evaluation = host.evaluateOutcome(down,context);
  assert.ok(host.compareEvaluated(left,down) < 0);
  assert.equal(left.evaluation.nearestTraversalDistance,3);
});

test('stateful evaluation penalizes immediate room reversal and remembers only live states', async () => {
  let liveView = {player:{x:1,y:1,z:0,health:2,mana:1,coins:0,turnCount:0},decision:null,
    room:{id:'room-a',depth:0,entities:[],hitWarnings:[]}};
  const live = {observe:()=>liveView,captureSimulationSnapshot:()=>({serialized:'{}'})};
  let childView = liveView;
  const child = {
    restoreSimulationSnapshot:async()=>{childView=liveView;},
    observe:()=>childView,
    inspectOperator:()=>({pathfinding:{pointsOfInterest:[{id:'entry',kind:'door',traversal:{unlocked:true},
      route:{reachable:true,steps:[]}}]}}),
    step:async action=>{
      childView = liveView.room.id === 'room-b' && action.direction === 'left'
        ? {player:{...liveView.player,x:1,turnCount:2},decision:null,room:{...liveView.room,id:'room-a'}}
        : action.direction === 'right'
        ? {player:{...liveView.player,x:2,turnCount:1},decision:null,room:{...liveView.room}}
        : {player:{...liveView.player,x:9,turnCount:1},decision:null,room:{...liveView.room,id:'room-b'}};
      return {terminated:false,truncated:false,info:{recorded:true,turnDelta:1}};
    },
  };
  const simulator = new host.IsolatedSimulator({source:()=>live,createFrame:()=>({contentWindow:{agent:child}})});
  await simulator.evaluateCandidates([{id:'move_right',action:{type:'Move',direction:'right'}}]);
  liveView = {player:{...liveView.player,x:9,turnCount:1},decision:null,room:{...liveView.room,id:'room-b'}};
  const report = await simulator.evaluateCandidates([
    {id:'move_left',action:{type:'Move',direction:'left'}},
    {id:'move_right',action:{type:'Move',direction:'right'}},
  ]);
  const backtrack = report.candidates.find(candidate=>candidate.id==='move_left');
  assert.equal(report.policy.previousRoomId,'room-a');
  assert.equal(backtrack.evaluation.backtracks,true);
  assert.equal(simulator.roomVisits.has('room-b'),true);
  assert.equal(simulator.roomVisits.has('room-a'),true);
  assert.equal(simulator.roomVisits.has('room-c'),false);
});

test('fatal outcomes always rank below survivable outcomes', () => {
  const context={stateVisits:new Map(),roomVisits:new Map(),previousRoomId:null,entryGoalIds:new Map()};
  const fatal={id:'fatal',outcome:{transition:'death',recorded:true,playerDelta:{health:-2},roomAfter:{id:'goal'},playerAfter:{x:1,y:1}}};
  const safe={id:'safe',outcome:{transition:null,recorded:true,threatsAfter:9,playerDelta:{health:-1,positionChanged:true},roomAfter:{id:'start'},playerAfter:{x:2,y:1}}};
  fatal.evaluation=host.evaluateOutcome(fatal,context);
  safe.evaluation=host.evaluateOutcome(safe,context);
  assert.ok(host.compareEvaluated(safe,fatal)<0);
});
