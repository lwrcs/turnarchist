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
