(() => {
  const frame = document.getElementById('game');
  const status = document.getElementById('status');
  const result = document.getElementById('result');
  document.getElementById('super-fast').onchange = event => api().setFastMode(event.target.checked);
  const buttons = Array.from(document.querySelectorAll('button'));
  const api = () => {
    const agent = frame.contentWindow.agent;
    if (!agent) throw new Error('Game is still loading; try again shortly');
    return agent;
  };
  async function run(operation) {
    buttons.forEach(button => { button.disabled = button.id !== 'batch-stop'; });
    status.textContent = 'Running…';
    try {
      const output = await operation();
      result.textContent = JSON.stringify(output, null, 2);
      status.textContent = 'Ready';
    } catch (error) {
      status.textContent = String(error);
      result.textContent = JSON.stringify({error: String(error)}, null, 2);
    } finally { buttons.forEach(button => { button.disabled = false; }); }
  }
  let batchRunner;
  const progress=p=>{status.textContent=`Seed ${p.seed} (${p.run}/${p.total}), decision ${p.decisions}, health ${p.health}`;};
  const summarizeBatch=report=>{
    window.lastBatchReport=report;
    return {...report,runs:report.runs.map(({trace,replay,...summary})=>({...summary,traceFrames:trace.length,lastDecisions:trace.slice(-5).map(t=>({action:t.action,policy:t.policy,turnDelta:t.info.turnDelta,decision:t.after.decision,player:t.after.player})),replayActions:replay?.replay?.actions?.length}))};
  };
  document.getElementById('batch-resume').onclick = () => run(async () => {
    if(!batchRunner)throw new Error('Run a baseline batch first');
    return summarizeBatch(await batchRunner.resumeLast({decisions:Number(document.getElementById('resume-decisions').value),onProgress:progress}));
  });
  document.getElementById('batch-stop').onclick = () => batchRunner?.stop();
  document.getElementById('batch-run').onclick = () => run(async () => {
    batchRunner = new AgentBatch.Runner(api());
    const report=await batchRunner.run({
      seeds:document.getElementById('batch-seeds').value.split(',').map(s=>s.trim()).filter(Boolean).map(Number),
      decisions:Number(document.getElementById('batch-decisions').value),
      scenario:document.getElementById('scenario').value,
      onProgress:progress,
    });
    return summarizeBatch(report);
  });
  document.getElementById('batch-trace').onclick = () => run(() => {
    if(!batchRunner?.report || batchRunner.running)throw new Error('Finish the batch before inspecting its trace');
    const seed=Number(document.getElementById('trace-seed').value);
    const entry=batchRunner.report.runs.find(item=>item.seed===seed);
    if(!entry)throw new Error('That seed is not in the latest batch');
    return {policy:batchRunner.report.policy,seed,status:entry.status,trace:entry.trace};
  });
  document.getElementById('batch-export').onclick = () => run(() => {
    const report=batchRunner?.report;
    if(!report || batchRunner.running)throw new Error('Finish or stop a batch before exporting');
    const url=URL.createObjectURL(new Blob([JSON.stringify(report)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='agent-batch.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    return {exported:true,runs:report.runs.length};
  });
  document.getElementById('reset').onclick = () => run(() => api().reset(Number(document.getElementById('seed').value), {scenario:document.getElementById('scenario').value}));
  document.getElementById('lighting-check').onclick = () => run(() => {
    const report = api().inspectLighting();
    const canvas = document.getElementById('light-map'), ctx=canvas.getContext('2d');
    ctx.fillStyle='#17131c';ctx.fillRect(0,0,canvas.width,canvas.height);
    const tiles=report.room.tiles, minX=Math.min(...tiles.map(t=>t.x)), minY=Math.min(...tiles.map(t=>t.y));
    const scale=Math.min(600/report.room.width,420/report.room.height);
    for (const t of tiles) {
      ctx.fillStyle=`rgb(${t.color.join(',')})`;
      ctx.fillRect(20+(t.x-minX)*scale,35+(t.y-minY)*scale,scale,scale);
      if (t.blocked) {ctx.strokeStyle='#555';ctx.strokeRect(20+(t.x-minX)*scale,35+(t.y-minY)*scale,scale,scale);}
    }
    for(const e of report.perception.room.entities) {
      ctx.fillStyle=e.appearance==='identified'?'#ff3333':'#ffaa00';
      ctx.fillRect(20+(e.x-minX)*scale,35+(e.y-minY)*scale,Math.max(3,scale),Math.max(3,scale));
    }
    ctx.strokeStyle='#00ffff';ctx.lineWidth=2;
    ctx.strokeRect(20+(report.player.x-minX)*scale,35+(report.player.y-minY)*scale,scale,scale);
    ctx.fillStyle='white';ctx.font='13px system-ui';
    ctx.fillText('Raw lighting · cyan: player · red: identified · orange: anonymous',10,18);
    window.lastLightingReport=report;
    return {...report,room:{...report.room,tiles:report.room.tiles.length}};
  });
  document.getElementById('extend').onclick = () => run(() => api().extendBudget(1000));
  document.getElementById('submit-action').onclick = () => run(() => api().step(JSON.parse(document.getElementById('action-json').value)));
  document.getElementById('inventory-smoke').onclick = () => run(async () => {
    const agent = api();
    const first = await agent.reset(Number(document.getElementById('seed').value), {maxSteps: 1});
    const weapon = first.inventory.find(item => item?.activeWeapon);
    if (!weapon) throw new Error('No starting weapon');
    const off = await agent.step({type:'UseItem', slotIndex:weapon.slot});
    if (off.info.turnDelta !== 0 || off.observation.inventory[weapon.slot].equipped) throw new Error('Unequip failed');
    agent.extendBudget(5);
    const on = await agent.step({type:'UseItem', slotIndex:weapon.slot});
    if (on.info.turnDelta !== 0 || !on.observation.inventory[weapon.slot].activeWeapon) throw new Error('Equip failed');
    const empty = on.observation.inventory.findIndex(item => item === null);
    if (empty < 0) throw new Error('No empty slot');
    await agent.step({type:'MoveItem', fromSlot:weapon.slot, toSlot:empty});
    const moved = await agent.step({type:'MoveItem', fromSlot:empty, toSlot:weapon.slot});
    if (moved.observation.player.turnCount !== first.player.turnCount || moved.observation.inventory[weapon.slot].id !== weapon.id) throw new Error('Slot move changed turns or item');
    return {inventorySmoke:'passed', actions:4, turnDelta:0, resumed:true};
  });
  document.getElementById('perceive').onclick = () => run(() => api().perceive());
  document.getElementById('observe').onclick = () => run(() => api().observe());
  document.querySelectorAll('[data-action]').forEach(button => {
    button.onclick = () => run(() => {
      const action = button.dataset.action;
      return api().step(['up', 'down', 'left', 'right'].includes(action)
        ? {type: 'Move', direction: action} : {type: action});
    });
  });
  document.getElementById('export').onclick = () => run(() => {
    const replay = api().exportReplay();
    const url = URL.createObjectURL(new Blob([JSON.stringify(replay)], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url; link.download = `agent-${replay.seed}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return {exported: true, seed: replay.seed, actions: replay.replay?.actions.length};
  });
  document.getElementById('smoke').onclick = () => run(async () => {
    const agent = api();
    const seed = Number(document.getElementById('seed').value);
    const first = await agent.reset(seed, {maxSteps: 4});
    const contract = agent.contract();
    if (!contract.buildId) throw new Error('Bundled agent has no build identity');
    if (contract.observationSchemaVersion !== 6) throw new Error('Unexpected observation schema');
    const perception = agent.perceive();
    if (perception.observationMode !== 'player-perception' || 'recentTransitions' in perception || 'seed' in perception) {
      throw new Error('Restricted perception leaked diagnostic envelope');
    }
    const initial = JSON.stringify({player: first.player, tiles: first.room.tiles});
    const actions = [];
    for (const direction of ['up', 'right', 'down', 'left']) {
      if (agent.observe().decision !== 'world') break;
      const step = await agent.step({type: 'Move', direction});
      actions.push({direction, ...step.info});
      if (step.terminated || step.truncated) break;
    }
    const replay = agent.exportReplay();
    if (replay.replay.actions.length !== actions.filter(action => action.recorded).length) {
      throw new Error('Replay count does not match the executed actions');
    }
    if (replay.recentTransitions.length !== actions.length) throw new Error('Missing turn history');
    let budgetResumed = false;
    if (replay.truncationReason === 'action-budget' && !replay.terminated) {
      const beforeResume = agent.observe();
      const resumed = agent.extendBudget(10);
      if (!resumed.ready || resumed.truncated || resumed.steps !== beforeResume.steps ||
          JSON.stringify(resumed.player) !== JSON.stringify(beforeResume.player) ||
          JSON.stringify(resumed.room) !== JSON.stringify(beforeResume.room) ||
          JSON.stringify(resumed.inventory) !== JSON.stringify(beforeResume.inventory) ||
          JSON.stringify(agent.exportReplay().replay) !== JSON.stringify(replay.replay)) {
        throw new Error('Budget continuation changed gameplay or failed to resume');
      }
      budgetResumed = true;
    }
    const second = await agent.reset(seed, {maxSteps: 4});
    const sameInitialState = initial === JSON.stringify({player: second.player, tiles: second.room.tiles});
    if (!sameInitialState) throw new Error('Same-seed reset produced a different initial player or tile map');
    if (second.recentTransitions.length !== 0) throw new Error('Reset retained previous episode history');
    return {smoke: 'passed', seed, sameInitialState, budgetResumed, perceptionMode: perception.observationMode, perceivedTiles: perception.room.tiles.length, actions,
      recordedActions: replay.replay.actions.length, backend: second.backend,
      observationMode: second.observationMode, buildId: contract.buildId,
      observationSchemaVersion: contract.observationSchemaVersion,
      historyFrames: replay.recentTransitions.length,
      equippedWeaponTraits: second.inventory.find(item => item?.equipped)?.traits ?? null};
  });
  frame.onload = () => { status.textContent = 'Game page loaded. Reset run when resources finish loading.'; };
})();
