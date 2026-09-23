/* Dedicated page only: use the unchanged live-controller budgets and ordinary dispatch. */
(function(root){
 'use strict';
 async function run(live,{seed=1,scenario='standard',onProgress=()=>{}}={}){
  const report={schemaVersion:1,suite:'horizon-rooms-browser-v1',seed,scenario,pass:false,status:'RUNNING',phase:'reset',results:[]};
  let controller,initialRoom=null,secondRoom=null,executedInsideSecond=false;
  const progress=()=>onProgress(JSON.parse(JSON.stringify(report)));
  function check(name,condition){report.results.push({name,pass:!!condition});if(!condition)throw Object.assign(new Error(name),{code:'HORIZON_ROOM_SMOKE_ASSERTION'});}
  try{
   progress();await live.reset(seed,{scenario,maxSteps:64});const first=live.observe();initialRoom=first.room.id;
   check('new warning codec and snapshot v3 are active',live.getPlanningCapabilities().snapshotSchemaVersion===3 && live.getPlanningCapabilities().warningContinuation==='horizon-warning-graph-v1');
   report.initialRoom=initialRoom;report.phase='cross-room-live-loop';progress();
   const ordinarySelector=root.AgentHorizonGoals.createLocalSelector();
   controller=root.AgentHorizonController.create({source:()=>live,selector:context=>{
    // After crossing, ask for an explicit interior tile instead of immediately returning
    // through the arrival door. The unchanged planner still certifies the action.
    if(context.view.room.id!==initialRoom){
     const v=context.view,g=context.geometry;
     const targets=g.tiles.filter(t=>t.z===v.player.z&&t.solid===false&&!t.isDoor&&!t.exit&&
      Math.abs(t.x-v.player.x)+Math.abs(t.y-v.player.y)===1).sort((a,b)=>a.y-b.y||a.x-b.x);
     for(const t of targets){const goal={kind:'position',roomId:v.room.id,x:t.x,y:t.y,z:v.player.z};
      if(!(context.excluded||[]).includes(root.AgentHorizonGoals.goalKey(goal)))return {goal,label:'Verify replanning inside the entered room'};}
    }
    return ordinarySelector(context);
   },onEvent:(state,event)=>{
    report.phase=event.type;report.latest={state:state.state,counters:state.counters,goal:state.goal,error:state.error,lastTransition:state.lastTransition};
    if(event.type==='executed'){
     if(event.to.roomId!==initialRoom && !secondRoom)secondRoom=event.to.roomId;
     // Entry alone is insufficient: require the NEXT root to restore/plan/dispatch successfully.
     if(secondRoom && event.from.roomId===secondRoom && event.to.roomId===secondRoom && event.parity===true && event.healthLoss===0){
      executedInsideSecond=true;controller.stop('multi-room-covered');
     }
    }
    progress();
   }});
   const result=await controller.start();report.run=result;report.secondRoom=secondRoom;
   report.reproduction=controller.failureReproduction?.()||null;
   // Surface the actual path-level restore error, rather than masking it with a coverage assertion.
   if(result.error)throw Object.assign(new Error(result.error.message),result.error);
   check('two distinct rooms reached through ordinary verified actions',!!secondRoom && secondRoom!==initialRoom);
   check('a new query and verified live action completed inside the second room',executedInsideSecond);
   check('every dispatched completed action matched its predicted successor',result.counters.actions===result.counters.verifiedActions && !result.quarantined);
   check('zero gross live health loss across the room boundary',result.counters.grossHealthLoss===0);
   check('original session budgets retained',result.options.maxActions===16 && result.options.maxRunMillis===60000 && result.planOptions.maxMillis===2000);
   check('ordinary agent steps equal verified live actions',live.observe().steps===first.steps+result.counters.actions);
   report.pass=true;report.status='PASS';report.phase='complete';progress();
  }catch(error){report.pass=false;report.status='FAIL';report.error=root.AgentHorizonCore.errorSummary(error);progress();}
  finally{controller?.dispose();}
  return report;
 }
 root.AgentHorizonRoomSmoke={run};
})(globalThis);
