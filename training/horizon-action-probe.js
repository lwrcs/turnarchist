/* Explicit diagnostic fixture. Never imported by the live viewer. */
document.getElementById('live-check').onclick = async () => {
 const out = document.getElementById('live-report');
 const result = await AgentHorizonLiveSmoke.run(document.getElementById('world').contentWindow.agent,
  {seed:1,scenario:'standard',onProgress:r=>out.textContent=JSON.stringify(r,null,2)});
 out.textContent = JSON.stringify(result,null,2);
};
document.getElementById('ladder-check').onclick = async () => {
 const out=document.getElementById('ladder-report'),report={events:[]};let controller;
 const publish=()=>out.textContent=JSON.stringify(report,null,2);
 try{
  const live=document.getElementById('world').contentWindow.agent;
  await live.reset(1,{scenario:'standard',maxSteps:100});
  const game=live.game,player=game.players[game.localPlayerID],rooms=game.levels[player.depth].rooms;
  let found;
  for(const room of rooms)for(let x=room.roomX;x<room.roomX+room.width;x++)for(let y=room.roomY;y<room.roomY+room.height;y++){
   const tile=room.roomArray[x]?.[y];
   if(tile?.constructor.name==='DownLadder'&&!tile.lockable.isLocked()){found={room,tile,x,y};break;}
  }
  if(!found)throw new Error('No unlocked down ladder in standard seed 1');
  player.roomGID=found.room.globalId;player.levelID=rooms.indexOf(found.room);game.room=found.room;
  player.x=found.x;player.y=found.y;player.z=0;found.tile.onCollide(player);
  report.before={decision:live.observe().decision,room:found.room.globalId,x:found.x,y:found.y};publish();
  controller=AgentHorizonController.create({source:()=>live,options:{maxActions:2,maxQueries:4,maxSimulations:512,intervalMs:0},
   planOptions:{maxDepth:2,maxSimulations:128},onEvent:(state,event)=>{report.events.push({state:state.state,event});publish();}});
  report.result=await controller.start({goal:{kind:'exit',roomId:found.room.globalId,x:found.x,y:found.y,z:0}});
  report.after=live.observe();
  report.pass=report.result.counters.verifiedActions===1&&report.result.counters.grossHealthLoss===0&&
   report.after.decision==='world'&&report.after.room.id!==found.room.globalId;
 }catch(e){report.error={message:e.message,code:e.code,path:e.path,details:e.details};report.pass=false;}
 finally{controller?.dispose();publish();}
};
document.getElementById('chest-check').onclick = async () => {
 const out=document.getElementById('chest-report'),report={events:[]};let controller;
 const publish=()=>out.textContent=JSON.stringify(report,null,2);
 try{
  const live=document.getElementById('world').contentWindow.agent;
  await live.reset(1,{scenario:'standard',maxSteps:100});
  const game=live.game,player=game.players[game.localPlayerID],rooms=game.levels[player.depth].rooms;
  let found,placement;
  for(const room of rooms){const chest=room.entities.find(e=>e.constructor.name==='Chest'&&e.health===3);
   if(!chest)continue;
   placement=[[0,1],[-1,0],[0,-1],[1,0]].find(([dx,dy])=>room.roomArray[chest.x+dx]?.[chest.y+dy]&&!room.roomArray[chest.x+dx][chest.y+dy].isSolid()&&!room.entities.some(e=>e!==chest&&!e.dead&&e.x===chest.x+dx&&e.y===chest.y+dy));
   if(placement){found={room,chest};break;}
  }
  if(!found)throw new Error('No reachable chest fixture in standard seed 1');
  player.roomGID=found.room.globalId;player.levelID=rooms.indexOf(found.room);game.room=found.room;
  player.x=found.chest.x+placement[0];player.y=found.chest.y+placement[1];player.z=found.chest.z;
  report.before={room:found.room.globalId,player:live.observe().player,chest:{x:found.chest.x,y:found.chest.y,health:found.chest.health},inventory:live.observe().inventory};publish();
  controller=AgentHorizonController.create({source:()=>live,options:{maxActions:5,maxQueries:8,maxSimulations:1024,intervalMs:0},
   planOptions:{maxDepth:5,maxSimulations:128},onEvent:(state,event)=>{report.events.push({state:state.state,event});publish();}});
  report.result=await controller.start({goal:{kind:'position',roomId:found.room.globalId,x:found.chest.x,y:found.chest.y,z:found.chest.z}});
  report.after=live.observe();
  report.pass=report.result.state==='COMPLETED'&&report.result.counters.grossHealthLoss===0&&
   report.result.counters.verifiedActions>=2&&report.after.player.x===found.chest.x&&report.after.player.y===found.chest.y;
 }catch(e){report.error={message:e.message,code:e.code,path:e.path,details:e.details};report.pass=false;}
 finally{controller?.dispose();publish();}
};
document.getElementById('run').onclick=async()=>{
 const report={operations:[],samples:[]},out=document.getElementById('report');
 const publish=()=>out.textContent=JSON.stringify(report,null,2);
 let sim,timer;
 try{
  const live=document.getElementById('world').contentWindow.agent;
  await live.reset(1,{scenario:'standard',maxSteps:100});
  const game=live.game,player=game.players[game.localPlayerID];
  const rooms=game.levels[player.depth].rooms;
  const room=rooms.find(r=>r.entities.some(e=>e.constructor.name==='SkullEnemy'));
  const skull=room.entities.find(e=>e.constructor.name==='SkullEnemy');
  player.roomGID=room.globalId;player.levelID=rooms.indexOf(room);game.room=room;
  const directions=[['up',0,1],['left',1,0],['down',0,-1],['right',-1,0]];
  const placement=directions.find(([,dx,dy])=>{
   const x=skull.x+dx,y=skull.y+dy;return room.roomArray[x]?.[y]&&!room.roomArray[x][y].isSolid()&&!room.entities.some(e=>!e.dead&&e!==skull&&e.x===x&&e.y===y);
  });
  if(!placement)throw new Error('No adjacent skeleton fixture position');
  player.x=skull.x+placement[1];player.y=skull.y+placement[2];player.z=skull.z;
  report.fixture={player:live.observe().player,skull:{x:skull.x,y:skull.y,health:skull.health},direction:placement[0]};publish();
  sim=new AgentSimulationHost.IsolatedSimulator({source:()=>live});
  const child=await sim.agent();
  const sample=()=>{const g=child.game,p=g.players[g.localPlayerID];return {busy:child.busy,ready:child.ready(),player:{x:p.x,y:p.y,busyAnimating:p.busyAnimating,pushLocked:p.isPushMoveInputLocked(),canMove:p.movement.canMove()},turn:p.getRoom().turn,failure:child.failure};};
  const host=AgentHorizonHost.create({source:()=>live,simulator:sim,onOperation:e=>{report.operations.push(e);publish();}});
  timer=setInterval(()=>{if(report.samples.length<25){report.samples.push(sample());publish();}},200);
  report.result=await host.planForExecution({kind:'position',roomId:room.globalId,x:skull.x,y:skull.y,z:skull.z},{maxMillis:2000,maxDepth:5,maxSimulations:128});
  report.final=sample();publish();
 }catch(e){report.error={message:e.message,stack:e.stack};publish();}
 finally{clearInterval(timer);sim?.dispose();}
};

document.getElementById('preserved').onclick = async () => {
 const report = { operations: [], queries: [], parity: [] }, out = document.getElementById('preserved-report');
 const publish = () => out.textContent = JSON.stringify(report, null, 2);
 let sourceRealm, branchRealm, sampling;
 try {
  const original = JSON.parse(localStorage.getItem('horizon-preserved-query-budget-6'));
  if (!original) throw new Error('No preserved checkpoint');
  sourceRealm = new AgentSimulationHost.IsolatedSimulator({ source: () => null });
  const source = await sourceRealm.agent();
  // Explicit fixture migration ONLY. No production equality check is bypassed:
  // the new realm checks the migrated envelope normally. Gameplay/RNG/IDs remain
  // byte-for-byte untouched. Keep the original checkpoint for before/after work.
  const wire = JSON.parse(original.snapshot.serialized);
  const field = (object, key) => {
   if (object[0] !== 'object') throw new Error('Unexpected checkpoint encoding');
   const pair = object[1].find(([k]) => k === key);
   if (!pair) throw new Error('Missing checkpoint field ' + key); return pair;
  };
  const build = field(field(field(wire.data, 'context')[1], 'contract')[1], 'buildId');
  report.buildMigration = { from: build[1], to: source.contract().buildId, changedField: '/context/contract/buildId' };
  build[1] = report.buildMigration.to;
  await source.restorePlanningSnapshot(JSON.stringify(wire));
  const expected = structuredClone(original.view); expected.contract.buildId = build[1];
  report.rootObservationEqual = AgentHorizonHost.viewIdentity(expected) === AgentHorizonHost.viewIdentity(source.observe());
  if (!report.rootObservationEqual) throw new Error('Preserved root observation differs');
  report.origin = { player: source.observe().player, room: source.observe().room.id, goal: original.goal };
  branchRealm = new AgentSimulationHost.IsolatedSimulator({ source: () => source });
  const branch = await branchRealm.agent();
  report.samples = [];
  sampling = setInterval(() => {
   if (report.samples.length >= 35) return;
   const g = branch.game, p = g.players[g.localPlayerID];
   report.samples.push({ ready: branch.ready(), busy: branch.busy, failure: branch.failure,
    player: { x:p.x,y:p.y,busyAnimating:p.busyAnimating,canMove:p.movement.canMove(),pushLocked:p.isPushMoveInputLocked(),
     locks:p.pushMoveInputLockEntities?.map(e=>({kind:e.constructor.name,dead:e.dead,progress:e.getPushAnimProgress01()})) },
    turn:p.getRoom().turn,camera:g.cameraAnimation?.active,paused:g.paused,gameState:g.gameState,
    enemies:p.getRoom().entities.filter(e=>!e.dead).map(e=>({kind:e.constructor.name,x:e.x,y:e.y,health:e.health})) });
   publish();
  },100);
  const host = AgentHorizonHost.create({ source: () => source, simulator: branchRealm, onOperation: e => { report.operations.push(e); } });
  for (let i = 0; i < 5; i++) {
   const r = await host.planForExecution(original.goal, { maxMillis: 2000, maxDepth: 5, maxSimulations: 128, heuristic: 'adapter' });
   report.queries.push({ status: r.status, stopReason: r.stopReason, stats: r.stats, timing: r.timing, plan: r.plan, error: r.error, candidates: r.candidateLedger }); publish();
   const current = source.observe();
   if (current.player.x === original.goal.x && current.player.y === original.goal.y && current.room.id === original.goal.roomId) break;
   if (!r.execution) throw new Error('No verified first action: ' + r.status);
   const step = await source.stepForPlanning(r.execution.action);
   const parity = { action: r.execution.action, guard: AgentHorizonCore.canonical(source.getPlanningGuard()) === r.execution.afterGuard,
    view: AgentHorizonHost.viewIdentity(source.observe()) === r.execution.afterView, healthLoss: step.planning.healthLoss };
   report.parity.push(parity); publish();
   if (!parity.guard || !parity.view || parity.healthLoss) throw new Error('Preserved replay successor mismatch');
  }
  const end = source.observe(); report.final = end.player;
  report.pass = end.room.id === original.goal.roomId && end.player.x === original.goal.x && end.player.y === original.goal.y;
  if (!report.pass) throw new Error('Preserved replay did not reach target within five actions');
 } catch (e) { report.error = { message: e.message, code: e.code, path: e.path }; report.pass = false; }
 finally { clearInterval(sampling); sourceRealm?.dispose(); branchRealm?.dispose(); publish(); }
};
