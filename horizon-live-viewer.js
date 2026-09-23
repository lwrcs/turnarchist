/* Dedicated viewer only: intentionally never imported by agent.html or ordinary evaluators. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),frame=$('game');
 let controller=null,busy=false,initialized=false,last=null,geometry=null,view=null,mapTransform=null;
 const source=()=>frame.contentWindow?.agent;
 const integer=id=>{const n=Number($(id).value);if(!Number.isSafeInteger(n))throw new Error('Invalid integer: '+id);return n;};
 function controls(){
  for(const id of ['initialize','seed','scenario','mode','x','y','max-actions','depth','max-sims','pace'])$(id).disabled=busy;
  for(const id of ['start','single'])$(id).disabled=busy||!initialized||last?.quarantined===true;
  $('stop').disabled=!busy||!controller?.running;$('export').disabled=!last;
 }
 function facts(){try{view=source().observe();geometry=source().inspectHorizonRoom();$('world-label').textContent=`${view.scenario} / seed ${view.seed} / room ${view.room.id}`;drawMap();}catch(_){/* never inspect an unfinished action */}}
 function drawMap(){
  const c=$('map'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);if(!geometry||!view)return;
  const tiles=geometry.tiles;if(!tiles.length)return;
  const minX=Math.min(...tiles.map(t=>t.x)),minY=Math.min(...tiles.map(t=>t.y));
  const maxX=Math.max(...tiles.map(t=>t.x)),maxY=Math.max(...tiles.map(t=>t.y));
  const scale=Math.min((c.width-28)/(maxX-minX+1),(c.height-28)/(maxY-minY+1));
  const ox=(c.width-(maxX-minX+1)*scale)/2,oy=(c.height-(maxY-minY+1)*scale)/2;mapTransform={minX,minY,scale,ox,oy};
  for(const t of tiles){ctx.fillStyle=t.exit||t.isDoor?'#cba56c':t.solid?'#34434a':'#586d73';ctx.fillRect(ox+(t.x-minX)*scale,oy+(t.y-minY)*scale,Math.max(1,scale-1),Math.max(1,scale-1));}
  for(const e of geometry.occupied){ctx.fillStyle='#93676b';ctx.fillRect(ox+(e.x-minX)*scale,oy+(e.y-minY)*scale,scale*e.width-1,scale*e.height-1);}
  function center(p){return [ox+(p.x-minX+.5)*scale,oy+(p.y-minY+.5)*scale];}
  const [px,py]=center(view.player);ctx.fillStyle='#aaf2cb';ctx.beginPath();ctx.arc(px,py,Math.max(3,scale*.3),0,Math.PI*2);ctx.fill();
  let goal=last?.goal;if(!busy&&$('mode').value!=='auto')goal={roomId:view.room.id,x:Number($('x').value),y:Number($('y').value)};
  if(goal&&goal.roomId===view.room.id){const[x,y]=center(goal),s=Math.max(4,scale*.4);ctx.strokeStyle='#ffe2a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s,y);ctx.closePath();ctx.stroke();}
 }
 function update(report,event){
  last=report;window.horizonLiveResult=report;$('state').textContent=report.state.replaceAll('_',' ');
  const diagnostic=report.error?[report.error.path,report.error.details?.expected,report.error.details?.actual].filter(Boolean).join(' · '):'';
  $('reason').textContent=[report.reason||event?.type||'',diagnostic].filter(Boolean).join(' · ');
  $('actions').textContent=report.counters.verifiedActions;$('simulations').textContent=report.counters.simulations;$('health').textContent=report.counters.grossHealthLoss;$('goals').textContent=report.counters.goals;
  $('goal').textContent=report.goal?`${report.goal.kind} ${report.goal.roomId} (${report.goal.x}, ${report.goal.y}, ${report.goal.z})`:'—';
  $('plan').textContent=report.lastPlan?`${report.lastPlan.status} · ${report.lastPlan.path.length} actions · ${report.lastPlan.stopReason}`:'—';
  $('action').textContent=report.lastTransition?JSON.stringify(report.lastTransition.action):'—';$('parity').textContent=report.lastTransition?(report.lastTransition.parity?'Verified exact successor':'Not verified'):'—';
  $('events').textContent=report.events.map(e=>`${String(e.sequence).padStart(3,'0')}  ${String(e.elapsedMs).padStart(6,' ')} ms  ${e.type}  ${JSON.stringify(Object.fromEntries(Object.entries(e).filter(([k])=>!['sequence','elapsedMs','type'].includes(k))))}`).join('\n');
  const candidates=report.lastPlan?.candidates||[];
  $('candidates').textContent=candidates.length?candidates.map((entry,index)=>`${String(index+1).padStart(3,'0')}  ${JSON.stringify(entry)}`).join('\n'):'No candidate actions evaluated in the latest query.';
  if(event?.type==='executed'||event?.type==='started'||event?.type==='finished')facts();else drawMap();controls();
 }
 async function waitAgent(){const deadline=performance.now()+15000;while(!source()){if(performance.now()>deadline)throw new Error('Game agent did not load within 15 seconds');await new Promise(r=>setTimeout(r,50));}}
 $('initialize').onclick=async()=>{
  if(busy)return;busy=true;initialized=false;last=null;controller?.dispose();controller=null;controls();$('state').textContent='Initializing';
  try{
   const seed=integer('seed');if(seed<0||seed>0xffffffff)throw new Error('Seed must be unsigned 32-bit');
   frame.src='./play.html?agent=1&horizonViewer=1&session='+Date.now();
   // Wait for this navigation's load, not a prior frame's agent.
   await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Game navigation timeout')),15000);frame.onload=()=>{clearTimeout(timer);resolve();};});
   await waitAgent();const live=source();
   if(typeof live.stepForHorizon!=='function')throw new Error('Rebuild the development bundle: missing agent.stepForHorizon');
   await live.reset(seed,{scenario:$('scenario').value,maxSteps:1000});
   initialized=true;facts();$('x').value=view.player.x;$('y').value=view.player.y;
   $('state').textContent='Ready';$('reason').textContent='Fresh world ready. Press Run or One verified action; no automatic execution.';
  }catch(error){$('state').textContent='Blocked';$('reason').textContent=String(error.message||error);}
  finally{busy=false;controls();}
 };
 async function run(singleAction){
  if(busy||!initialized)return;
  try{
   const current=source().observe(),mode=$('mode').value;
   const goal=mode==='auto'?null:{kind:mode,roomId:current.room.id,x:integer('x'),y:integer('y'),z:current.player.z};
   controller?.dispose();last=null;
   controller=AgentHorizonController.create({source,options:{maxActions:integer('max-actions'),intervalMs:integer('pace')},
     planOptions:{maxDepth:integer('depth'),maxSimulations:integer('max-sims')},onEvent:update});
   busy=true;controls();await controller.start({goal,singleAction});
  }catch(error){$('state').textContent='Blocked';$('reason').textContent=String(error.message||error);}
  finally{busy=false;controls();}
 }
 $('start').onclick=()=>run(false);$('single').onclick=()=>run(true);$('stop').onclick=()=>controller?.stop('viewer-stop');
 $('export').onclick=()=>{if(!last)return;const data={format:'horizon-live-diagnostics-v1',privacy:'Privileged navigation diagnostics and, on restore failure, a bounded replayable game snapshot. Review before sharing; not a PPO trajectory.',report:last,reproduction:controller?.failureReproduction?.()||null};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='horizon-live-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('map').onclick=e=>{if(busy||!view||!mapTransform)return;const rect=e.currentTarget.getBoundingClientRect(),m=mapTransform;
  const x=Math.floor(((e.clientX-rect.left)*e.currentTarget.width/rect.width-m.ox)/m.scale)+m.minX;
  const y=Math.floor(((e.clientY-rect.top)*e.currentTarget.height/rect.height-m.oy)/m.scale)+m.minY;
  const tile=geometry.tiles.find(t=>t.x===x&&t.y===y);if(!tile)return;
  $('x').value=x;$('y').value=y;$('mode').value=tile.exit||tile.isDoor?'exit':'position';drawMap();};
 for(const id of ['mode','x','y'])$(id).addEventListener('change',drawMap);
 window.addEventListener('pagehide',()=>controller?.dispose());controls();
})();
