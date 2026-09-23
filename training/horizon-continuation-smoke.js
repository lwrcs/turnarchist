/* Isolated regression probe: keep planning after entering the second room. */
(function(root){
 'use strict';
 async function run(live,{seed=1,scenario='standard',onProgress=()=>{}}={}){
  const report={suite:'horizon-continuation-browser-v1',seed,scenario,pass:false,phase:'reset',results:[]};
  report.repairsUnderTest=['retired zombie warning source','pending down-ladder prompt',
   'enemy cached path','explicitly empty loot','standard restore readiness barrier'];
  let controller,lastDispatch,planner,planningSim,secondRoom=null,thirdRoom=null;
  let edges={};
  const ordinaryStep=live.stepForHorizon;
  const entityState=agent=>{
   const game=agent.game,player=game.players[game.localPlayerID];
   return player.getRoom().entities.filter(e=>!e.dead).map(e=>{
    const fields={};for(const [key,d] of Object.entries(Object.getOwnPropertyDescriptors(e)))
     if('value' in d && (d.value==null || ['boolean','number','string'].includes(typeof d.value)))fields[key]=d.value;
    return {kind:e.constructor.name,fields,pathCache:e._pathCache?{...e._pathCache,moves:e._pathCache.moves.map(m=>({pos:{...m.pos}}))}:e._pathCache,
     drops:(e.drops||[]).map(item=>({kind:item.constructor.name,id:item.globalId,name:item.name,stackCount:item.stackCount,pickedUp:item.pickedUp})),
     targetPlayer:e.targetPlayer?{id:e.targetPlayer.id,x:e.targetPlayer.x,y:e.targetPlayer.y,lastX:e.targetPlayer.lastX,lastY:e.targetPlayer.lastY}:null};
   });
  };
  try{
   await live.reset(seed,{scenario,maxSteps:64});
   report.initial=live.observe();
   live.stepForHorizon=async function(action,authorization){
    lastDispatch={action,root:this.capturePlanningSnapshot(),before:this.observe(),entitiesBefore:entityState(this)};
    const result=await ordinaryStep.call(this,action,authorization);
    lastDispatch.after=this.observe();lastDispatch.entitiesAfter=entityState(this);return result;
   };
   planningSim=new root.AgentSimulationHost.IsolatedSimulator({source:()=>live});
   const getAgent=planningSim.agent.bind(planningSim),wrapped=new WeakSet();
   planningSim.agent=async()=>{const child=await getAgent();if(!wrapped.has(child)){
    wrapped.add(child);const step=child.stepForPlanning.bind(child);
    child.stepForPlanning=async action=>{
     const first=child.observe().steps===live.observe().steps;
     const before=first?entityState(child):null;const result=await step(action);
     if(first)edges[JSON.stringify(action)]={before,after:child.observe()};return result;
    };
   }return child;};
   planner=root.AgentHorizonHost.create({source:()=>live,simulator:planningSim});
   controller=root.AgentHorizonController.create({source:()=>live,planner,
    selector:context=>context.view.room.id===report.initial.room.id?
     {goal:{kind:'exit',roomId:context.view.room.id,x:22,y:6,z:0}}:
      context.view.room.id===secondRoom?
      {goal:{kind:'exit',roomId:context.view.room.id,x:17,y:12,z:0}}:
      {goal:{kind:'position',roomId:context.view.room.id,x:11,y:19,z:0}},
    options:{maxActions:32},planOptions:{maxDepth:17,maxSimulations:128},
    onEvent:(state,event)=>{
     if(event.type==='planning')edges={};
     if(event.type==='executed'){
      if(!secondRoom && event.to.roomId!==report.initial.room.id)secondRoom=event.to.roomId;
      const delta={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]}[event.action?.direction]||[0,0];
      const atReportedExit=event.from.x+delta[0]===17 && event.from.y+delta[1]===12;
      if(secondRoom && atReportedExit && event.from.roomId===secondRoom && event.to.roomId!==secondRoom && event.parity===true){
       report.reportedExitCompleted=true;thirdRoom=event.to.roomId;
      }
      if(thirdRoom && event.to.roomId===thirdRoom && event.to.x===11 && event.to.y===19 && event.parity===true){
       report.postExitPositionCompleted=true;controller.stop('post-exit-position-completed');
      }
      if(thirdRoom && event.from.roomId===thirdRoom && event.from.x===16 && event.from.y===19 &&
         event.action?.type==='Move' && event.action.direction==='left' && event.parity===true){
       report.dynamicSpawnStepCompleted=true;controller.stop('dynamic-spawn-step-completed');
      }
     }
     report.phase=event.type;report.run=state;onProgress(report);
    }});
   report.run=await controller.start();
   report.reproduction=controller.failureReproduction();
   if(report.run.error)throw Object.assign(new Error(report.run.error.message),report.run.error);
   if(!report.reportedExitCompleted || (!report.postExitPositionCompleted && !report.dynamicSpawnStepCompleted) || report.run.counters.verifiedActions!==report.run.counters.actions)
    throw Object.assign(new Error('Reported exit coverage incomplete: '+report.run.reason),{
     code:'HORIZON_CONTINUATION_COVERAGE_INCOMPLETE',path:'/coverage/reportedExit',
     details:{phase:'live-route',expected:'Completed exit (17,12) and the formerly divergent post-exit spawn step with every dispatched successor verified',
      actual:report.run.reason+'; '+report.run.counters.verifiedActions+'/'+report.run.counters.actions+' verified actions'}});
   if(report.run.counters.grossHealthLoss!==0 || report.run.quarantined)throw new Error('Unsafe continuation');
   report.pass=true;
  }catch(error){report.error=root.AgentHorizonCore.errorSummary(error);
   if(error.code==='HORIZON_EXECUTION_DIVERGED'){
    report.executionReproduction=lastDispatch;
    lastDispatch.searchEdge=edges[JSON.stringify(lastDispatch.action)];
    const sim=new root.AgentSimulationHost.IsolatedSimulator({source:()=>live});
    try{const child=await sim.agent();await child.reset(seed,{scenario,maxSteps:64});await child.restorePlanningSnapshot(lastDispatch.root.serialized);
     lastDispatch.restoredBefore=child.observe();lastDispatch.restoredEntitiesBefore=entityState(child);
     await child.stepForPlanning(lastDispatch.action);
     lastDispatch.predictedAfter=child.observe();lastDispatch.predictedEntitiesAfter=entityState(child);
    }catch(probeError){report.probeError=root.AgentHorizonCore.errorSummary(probeError);}finally{sim.dispose();}
   }
  }
  finally{live.stepForHorizon=ordinaryStep;controller?.dispose();planner?.dispose();planningSim?.dispose();}
  report.phase='complete';onProgress(report);return report;
 }
 root.AgentHorizonSmoke={run};
})(globalThis);
