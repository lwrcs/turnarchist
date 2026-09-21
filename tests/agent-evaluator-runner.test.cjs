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
