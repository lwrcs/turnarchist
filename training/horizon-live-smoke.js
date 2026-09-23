/* Only the dedicated validation page loads this. It intentionally advances its own live game. */
(function(root){
 'use strict';
 async function run(live,{seed=1,scenario='standard',onProgress=()=>{}}={}){
  const report={schemaVersion:1,suite:'horizon-live-browser-v1',seed,scenario,pass:false,status:'RUNNING',phase:'reset',results:[]};let controller;
  const progress=()=>onProgress(JSON.parse(JSON.stringify(report)));
  const checked=(name,condition)=>{report.results.push({name,pass:!!condition});if(!condition)throw Object.assign(new Error(name),{code:'HORIZON_LIVE_SMOKE_ASSERTION'});};
  try{
   progress();await live.reset(seed,{scenario,maxSteps:64});
   const before=live.observe();checked('live execution capability and unchanged snapshot v3',live.getHorizonExecutionCapabilities().version===1&&live.getPlanningCapabilities().snapshotSchemaVersion===3);
   report.phase='bounded-live-loop';progress();
   controller=root.AgentHorizonController.create({source:()=>live,options:{maxActions:3,maxQueries:12,maxSimulations:1536,intervalMs:0},
    planOptions:{maxDepth:2,maxSimulations:128},onEvent:(s,e)=>{report.phase=e.type;report.latest={state:s.state,counters:s.counters,goal:s.goal,lastTransition:s.lastTransition,error:s.error};progress();}});
   checked('creating controller does not execute',live.observe().steps===before.steps&&controller.snapshot().state==='IDLE');
   const result=await controller.start();report.run=result;
   checked('three live actions complete and each matches its evaluated successor',result.counters.verifiedActions===3&&result.counters.actions===3&&result.reason==='action-budget');
   checked('one replan per action or invalidation',result.counters.queries>=result.counters.actions);
   checked('zero measured live gross health loss',result.counters.grossHealthLoss===0);
   checked('ordinary API advanced only admitted steps',live.observe().steps===before.steps+3);
   checked('bounded action/query/simulation counters',result.counters.actions<=3&&result.counters.queries<=12&&result.counters.simulations<=1536);
   controller.dispose();report.phase='cancel-before-dispatch';progress();const guard=root.AgentHorizonCore.canonical(live.getPlanningGuard());
   controller=root.AgentHorizonController.create({source:()=>live,options:{maxActions:1,intervalMs:0},onEvent:(_,e)=>{if(e.type==='started')controller.stop('smoke-cancel');}});
   const cancelled=await controller.start();checked('cancelled controller does not act',cancelled.counters.dispatches===0&&cancelled.state==='STOPPED');
   checked('cancellation preserves live guard',root.AgentHorizonCore.canonical(live.getPlanningGuard())===guard);
   report.pass=true;report.status='PASS';report.phase='complete';progress();
  }catch(error){report.pass=false;report.status='FAIL';report.error=root.AgentHorizonCore.errorSummary(error);progress();}
  finally{controller?.dispose();}
  return report;
 }
 root.AgentHorizonLiveSmoke={run};
})(globalThis);
