/* Finite synthetic multi-room world. No claim to be the Turnarchist engine. */
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));
const R=process.env.HORIZON_REPO||require('node:path').resolve(__dirname,'../..');
const Core=require(R+'/agent-horizon-core.js'),Host=require(R+'/agent-horizon-host.js');
const D={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
function room(id,{exits=[],items=[],entities=[],width=7,height=3,depth=0,boss=false}={}){return{id,depth,width,height,exits,items,entities,boss};}
function fixture({rooms=[room('A',{exits:[{x:6,y:1,to:'B',arrival:{x:1,y:1}}]}),room('B',{exits:[{x:0,y:1,to:'A',arrival:{x:5,y:1}},{x:6,y:1,to:'C',arrival:{x:1,y:1}}]}),room('C',{exits:[{x:0,y:1,to:'B',arrival:{x:5,y:1}}]})],startRoom='A',start={x:1,y:1},simEffect,liveEffect}={}){
 const definitions=Object.fromEntries(rooms.map(r=>[r.id,clone(r)]));let calls={simulations:0,live:0,restores:0,disposals:0},pollution=0;
 function agent(isLive){const a={state:{id:startRoom,x:start.x,y:start.y,z:0,health:5,turns:0,steps:0,entered:[startRoom],world:clone(definitions)},isLive,
 observe(){const r=this.state.world[this.state.id];return{seed:1,scenario:'standard',steps:this.state.steps,maxSteps:1000,initialized:true,ready:true,terminated:false,truncated:false,failure:null,contract:{buildId:'expedition-fixture',settingsId:'fixed'},player:{x:this.state.x,y:this.state.y,z:0,health:this.state.health,maxHealth:5,turnCount:this.state.turns},room:{id:r.id,depth:r.depth,x:0,y:0,width:r.width,height:r.height,entities:clone(r.entities),items:clone(r.items),hitWarnings:clone(r.warnings||[]),tiles:this.inspectHorizonRoom().tiles.map(t=>({x:t.x,y:t.y,kind:t.isDoor?'Door':'Floor'}))},inventory:[],decision:'world',selectionChoices:null,vendingMachine:null};},
 inspectHorizonRoom(){const r=this.state.world[this.state.id],tiles=[];for(let x=0;x<r.width;x++)for(let y=0;y<r.height;y++){const e=r.exits.find(e=>e.x===x&&e.y===y);tiles.push({x,y,z:0,solid:false,isDoor:!!e,exit:false,traversal:e?{unlocked:true,kind:'door'}:null});}return{schemaVersion:1,roomId:r.id,tiles,occupied:r.entities.filter(e=>e.collidable).map(e=>({...e,z:0,width:e.width||1,height:e.height||1}))};},
 inspectHorizonIntent(){const r=this.state.world[this.state.id],g=this.inspectHorizonRoom();return{...g,coverage:'full-current-room',room:{id:r.id,depth:r.depth,pathId:'main',bossRoom:r.boss,progressBlockedByEnemies:r.boss&&r.entities.some(e=>e.isEnemy)},tiles:g.tiles.map(t=>{const e=r.exits.find(e=>e.x===t.x&&e.y===t.y);return{...t,destination:e&&this.state.entered.includes(e.to)?{roomId:e.to,depth:this.state.world[e.to].depth}:null};})};},
 getPlanningCapabilities(){return{snapshotSchemaVersion:3,format:'turnarchist-planning-snapshot-v3',codec:'fixture-not-savev2'};},
 getHorizonExecutionCapabilities(){return{version:1,mode:'ordinary-agent-step',metric:'gross-health-decrease-v1',precondition:'dispatch-guard-v1'};},
 getPlanningGuard(){return{state:clone(this.state)};},capturePlanningSnapshot(){return{schemaVersion:3,source:'privileged-horizon-snapshot',serialized:JSON.stringify(this.state)};},
 async restorePlanningSnapshot(text){if(isLive){pollution++;throw Error('Live restore forbidden');}calls.restores++;this.state=JSON.parse(text);},
 async advance(action){const before=this.observe(),r=this.state.world[this.state.id],delta=D[action.direction];let recorded=false;
 if(action.type==='Move'&&delta){const x=this.state.x+delta[0],y=this.state.y+delta[1];if(x>=0&&x<r.width&&y>=0&&y<r.height){const e=r.exits.find(e=>e.x===x&&e.y===y),target=r.entities.find(e=>e.collidable&&e.x===x&&e.y===y);
 if(e){this.state.id=e.to;this.state.x=e.arrival.x;this.state.y=e.arrival.y;if(!this.state.entered.includes(e.to))this.state.entered.push(e.to);}
 else if(target){target.health--;if(target.health<=0)r.entities=r.entities.filter(e=>e!==target);}else{this.state.x=x;this.state.y=y;r.items=r.items.filter(i=>i.x!==x||i.y!==y);}recorded=true;}}
 this.state.steps++;this.state.turns+=Number(recorded);let loss=0;const effect=isLive?liveEffect:simEffect;if(effect)loss=await effect(this,action,before)||0;
 if(isLive)calls.live++;else calls.simulations++;
 return{terminated:false,truncated:false,info:{recorded,turnDelta:Number(recorded)},metric:{schemaVersion:1,metric:'gross-health-decrease-v1',healthLoss:loss,dispatched:true}};},
 async stepForPlanning(action){const r=await this.advance(action);return{...r,planning:r.metric};},
 async stepForHorizon(action,permit){if(!isLive)throw Error('Not visible agent');if(permit.signal?.aborted)throw Object.assign(Error('cancelled'),{code:'HORIZON_CANCELLED'});if(permit.guard!==Core.canonical(this.getPlanningGuard())||permit.view!==Host.viewIdentity(this.observe()))throw Object.assign(Error('stale'),{code:'HORIZON_STALE_STATE'});const r=await this.advance(action);return{...r,horizon:r.metric};}
 };return a;}
 const live=agent(true),child=agent(false),source=()=>live,simulator={source,pending:null,agent:async()=>child,dispose(){calls.disposals++;}};return{live,child,source,simulator,counts:()=>({...calls,pollution}),room};
}
module.exports={fixture,room};
