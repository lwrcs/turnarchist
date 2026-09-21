const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Runner,interfaceAction}=require('../agent-evaluator-runner.js');

test('interface decisions become explicit non-directional actions',()=>{
  assert.deepEqual(interfaceAction({decision:'ladder'}),{type:'LadderConfirm'});
  assert.deepEqual(interfaceAction({decision:'vending'}),{type:'DismissInteraction'});
  assert.deepEqual(interfaceAction({decision:'selection',selectionChoices:[{index:0,label:'Take',enabled:true},{index:1,label:'Cancel',enabled:true}]}),
    {type:'SelectOption',index:1});
});

test('runner executes the evaluator selection against the visible agent',async()=>{
  let view={terminated:false,decision:'world',player:{x:1,y:1,health:2},room:{id:'a',depth:0}};
  const actions=[];
  const agent={
    reset:async()=>view,observe:()=>view,inspectOperator:()=>({tactical:{moves:[{direction:'left',resolution:'move'}]}}),
    step:async action=>{actions.push(action);view={...view,player:{...view.player,x:0},room:{...view.room,id:'b'}};
      return {terminated:false,truncated:true,info:{recorded:true,turnDelta:1}};},
    exportReplay:()=>({replay:{actions}}),
  };
  let disposed=false;
  const simulator={evaluateCandidates:async candidates=>({candidates,selected:{action:{type:'Move',direction:'left'}}}),
    dispose:()=>{disposed=true;}};
  const report=await new Runner(agent,{createSimulator:()=>simulator}).run({seed:123,decisions:4});
  assert.deepEqual(actions,[{type:'Move',direction:'left'}]);
  assert.equal(report.status,'budget-incomplete');
  assert.deepEqual(report.roomsVisited,['a','b']);
  assert.equal(disposed,true);
});

test('runner suppresses a dismissed zero-turn vending contact until world state changes',async()=>{
  let view={terminated:false,decision:'world',player:{x:1,y:1,z:0,health:2,turnCount:0,coins:0},
    inventory:[],room:{id:'a',depth:0}};
  const offered=[];
  const agent={
    reset:async()=>view,observe:()=>view,
    inspectOperator:()=>({tactical:{moves:[
      {direction:'up',resolution:'blocked-or-interact',occupantId:'vending'},
      {direction:'right',resolution:'move'},
    ]}}),
    step:async action=>{
      if(action.type==='DismissInteraction')view={...view,decision:'world'};
      else if(action.direction==='up')view={...view,decision:'vending'};
      else view={...view,player:{...view.player,x:2,turnCount:1}};
      return {terminated:false,truncated:action.direction==='right',info:{recorded:true,turnDelta:action.direction==='right'?1:0}};
    },
    exportReplay:()=>({replay:{actions:[]}}),
  };
  const simulator={
    evaluateCandidates:async candidates=>{offered.push(candidates.map(candidate=>candidate.action.direction));
      return {candidates,selected:{action:candidates[0].action}};},
    dispose:()=>{},
  };
  const report=await new Runner(agent,{createSimulator:()=>simulator}).run({seed:123,decisions:4});
  assert.deepEqual(offered,[['up','right'],['right']]);
  assert.equal(report.status,'budget-incomplete');
});
