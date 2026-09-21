/* Executes the stateful deterministic preview evaluator against the visible game. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports
    ?require('./agent-simulation-host.js'):root.AgentSimulationHost);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.AgentEvaluatorRunner=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Host){
  const copy=value=>JSON.parse(JSON.stringify(value));
  const validBudget=value=>Number.isInteger(value)&&value>=1&&value<=10000;
  const compactSelection=selected=>selected?{
    id:selected.id,
    action:copy(selected.action),
    evaluation:selected.evaluation?{
      utility:selected.evaluation.utility,
      reasons:copy(selected.evaluation.reasons??[]),
    }:null,
    outcome:selected.outcome?{
      status:selected.outcome.status,
      transition:selected.outcome.transition,
      recorded:selected.outcome.recorded,
      playerDelta:copy(selected.outcome.playerDelta??{}),
    }:null,
  }:null;
  function interfaceAction(view) {
    if(view.decision==='ladder')return {type:'LadderConfirm'};
    if(view.decision==='vending'||view.decision==='dismissable-interaction')return {type:'DismissInteraction'};
    if(view.decision==='selection') {
      const choice=view.selectionChoices?.find(option=>option.enabled&&option.label==='Cancel')??
        view.selectionChoices?.find(option=>option.enabled);
      return choice?{type:'SelectOption',index:choice.index}:null;
    }
    return null;
  }
  class Runner {
    constructor(agent,{createSimulator}={}) {
      this.agent=agent;this.createSimulator=createSimulator??(()=>new Host.IsolatedSimulator({source:()=>this.agent}));
      this.running=false;this.stopping=false;this.simulator=null;this.report=null;
    }
    stop(){this.stopping=true;}
    async run({seed,decisions=100,scenario='standard',onProgress=()=>{}}) {
      if(this.running)throw new Error('Evaluator runner is already running');
      if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new Error('seed must be a uint32');
      if(!validBudget(decisions))throw new Error('decisions must be 1..10000');
      this.running=true;this.stopping=false;this.simulator=this.createSimulator();
      const report=this.report={schemaVersion:1,source:'stateful-deterministic-preview-evaluator',seed,scenario,
        decisionBudget:decisions,startedAt:new Date().toISOString(),status:'running',decisions:0,turns:0,
        roomsVisited:[],trace:[]};
      try {
        await this.agent.reset(seed,{maxSteps:decisions,scenario});
        const rooms=new Set();
        while(report.decisions<decisions&&!this.stopping) {
          const before=copy(this.agent.observe());rooms.add(before.room.id);
          if(before.terminated){report.status='dead';break;}
          let action=interfaceAction(before),evaluation=null;
          if(!action&&before.decision==='world') {
            const candidates=Host.candidateActions(this.agent.inspectOperator());
            if(!candidates.length){report.status='no-legal-actions';break;}
            evaluation=await this.simulator.evaluateCandidates(candidates);
            action=evaluation.selected?.action??null;
          }
          if(!action){report.status='unsupported-decision';break;}
          const step=await this.agent.step(copy(action));
          const after=copy(this.agent.observe());rooms.add(after.room.id);
          report.decisions++;report.turns+=step.info?.turnDelta??0;report.roomsVisited=[...rooms];
          // Keep reports small. A full preview selection includes the complete
          // post-action operator observation, which grows into hundreds of MB
          // when retained once per decision and can crash the visible viewer.
          report.trace.push({decision:report.decisions,action:copy(action),selected:compactSelection(evaluation?.selected),
            before:{room:before.room.id,depth:before.room.depth,player:before.player,decision:before.decision},
            after:{room:after.room.id,depth:after.room.depth,player:after.player,decision:after.decision},
            info:{recorded:step.info?.recorded===true,turnDelta:step.info?.turnDelta??null}});
          if(report.trace.length>100)report.trace.shift();
          onProgress({seed,decisions:report.decisions,health:after.player.health,room:after.room.id,
            depth:after.room.depth,evaluation,action:copy(action)});
          if(step.terminated){report.status='dead';break;}
          if(step.truncated){report.status='budget-incomplete';break;}
          // Give rendering and the Stop button time between branch searches.
          await new Promise(resolve=>setTimeout(resolve,16));
        }
        if(report.status==='running')report.status=this.stopping?'cancelled':'budget-incomplete';
        report.replay=this.agent.exportReplay();
      } catch(error) {
        report.status='error';report.error=String(error);
        try{report.replay=this.agent.exportReplay();}catch{}
      } finally {
        this.simulator?.dispose?.();this.simulator=null;this.running=false;
        report.finishedAt=new Date().toISOString();
      }
      return report;
    }
  }
  return {Runner,interfaceAction};
});
