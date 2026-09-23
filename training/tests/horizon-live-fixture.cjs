'use strict';
const Core=require('../../agent-horizon-core.js'),Host=require('../../agent-horizon-host.js'),Controller=require('../../agent-horizon-controller.js');
const clone=v=>JSON.parse(JSON.stringify(v));
function fixture(options={}) {
 const initial={seed:1,scenario:'standard',steps:0,maxSteps:64,initialized:true,ready:true,terminated:false,truncated:false,failure:null,
  contract:{buildId:'fixture',settings:'fixed'},player:{x:0,y:0,z:0,health:5,maxHealth:5,turnCount:0},
  room:{id:'A',depth:0,x:0,y:0,width:9,height:3,entities:[],items:[],hitWarnings:[],tiles:[]},inventory:[],decision:'world',selectionChoices:null,vendingMachine:null};
 for(let x=0;x<9;x++)for(let y=0;y<3;y++)initial.room.tiles.push({x,y,kind:'Floor'});
 let simulations=0,executions=0,disposals=0;
 function agent(isLive) {
  return {view:clone(initial), observe(){return clone(this.view);},
   getPlanningCapabilities(){return {snapshotSchemaVersion:3,format:'turnarchist-planning-snapshot-v3',codec:'tagged-planning-data-v1',healthMetric:'gross-health-decrease-v1',reconstruction:'diagnostic-allocator-replay-v1'};},
   getHorizonExecutionCapabilities(){return {version:1,mode:'ordinary-agent-step',metric:'gross-health-decrease-v1',precondition:'dispatch-guard-v1'};},
   getPlanningGuard(){return {view:Host.viewIdentity(this.view)};},
   capturePlanningSnapshot(){return {schemaVersion:3,source:'privileged-horizon-snapshot',serialized:JSON.stringify(this.view)};},
   async restorePlanningSnapshot(text){if(isLive)throw Error('LIVE_RESTORE_FORBIDDEN');this.view=JSON.parse(text);},
   inspectHorizonRoom(){return {schemaVersion:1,roomId:this.view.room.id,occupied:[],tiles:this.view.room.tiles.map(t=>({...t,z:0,solid:false,isDoor:false,exit:false,traversal:null}))};},
   async advance(action){
    const d={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]}[action.direction];
    let recorded=false;
    if(d){const x=this.view.player.x+d[0],y=this.view.player.y+d[1];if(x>=0&&x<9&&y>=0&&y<3){this.view.player.x=x;this.view.player.y=y;recorded=true;}}
    this.view.steps++;this.view.player.turnCount+=+recorded;this.view.truncated=this.view.steps>=this.view.maxSteps;this.view.ready=!this.view.truncated;
    const result={terminated:false,truncated:this.view.truncated,info:{recorded,turnDelta:+recorded},metric:{schemaVersion:1,metric:'gross-health-decrease-v1',healthLoss:0,dispatched:true}};
    if(isLive)executions++;else simulations++;
    await (isLive?options.liveEffect:options.simEffect)?.(this,action,result);
    return result;
   },
   async stepForPlanning(action){const r=await this.advance(action);return {...r,planning:r.metric};},
   async stepForHorizon(action,permit){
    if(permit.signal?.aborted)throw Object.assign(Error('cancelled'),{code:'HORIZON_CANCELLED'});
    if(permit.guard!==Core.canonical(this.getPlanningGuard())||permit.view!==Host.viewIdentity(this.view))throw Object.assign(Error('stale'),{code:'HORIZON_STALE_STATE'});
    const r=await this.advance(action);return {...r,horizon:r.metric};
   }
  };
 }
 const live=agent(true),child=agent(false);let current=live;
 const source=()=>current,simulator={source,pending:null,agent:async()=>child,dispose(){disposals++;}};
 const planner=Host.create({source,simulator,stepTimeoutMs:100});
 const controller=Controller.create({source,planner,options:{intervalMs:0,...options.controllerOptions},planOptions:{maxDepth:2,maxMillis:0,...options.planOptions},onEvent:options.onEvent||(()=>{})});
 return {live,child,source,simulator,planner,controller,replace(a){current=a;},goal:{kind:'position',roomId:'A',x:3,y:0,z:0},counts:()=>({simulations,executions,disposals})};
}
module.exports={fixture};
