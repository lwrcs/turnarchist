/* Explicit, opt-in receding-horizon controller. No automatic training/evaluator integration. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./agent-horizon-core.js'), require('./agent-horizon-host.js'), require('./agent-horizon-goals.js'));
  else root.AgentHorizonController = factory(root.AgentHorizonCore, root.AgentHorizonHost, root.AgentHorizonGoals);
})(typeof globalThis !== 'undefined' ? globalThis : this, function(Core, Host, Goals) {
  'use strict';
  const VERSION = 'horizon-live-v1', METRIC = 'gross-health-decrease-v1', POLICY = 'zero-gross-health-loss-v1';
  const leases = new WeakMap();
  const copy = value => JSON.parse(Core.canonical(value));
  const DEFAULTS = Object.freeze({ maxActions: 16, maxQueries: 32, maxSimulations: 4096,
    maxRunMillis: 60000, maxInvalidations: 4, maxGoalFailures: 3, maxStagnantActions: 8,
    liveActionTimeoutMs: 15000, intervalMs: 120, maxEvents: 120 });
  const PLAN_DEFAULTS = Object.freeze({ maxDepth: 5, maxSimulations: 128, maxExpanded: 128,
    maxNodes: 512, maxMillis: 2000, heuristic: 'adapter' });
  function optionsFor(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Controller options must be a record');
    for (const k of Object.keys(input)) if (!(k in DEFAULTS)) throw new TypeError('Unknown controller option: '+k);
    const out = { ...DEFAULTS, ...input };
    for (const k of Object.keys(DEFAULTS)) if (!Number.isSafeInteger(out[k]) || out[k] < 0) throw new TypeError('Invalid '+k);
    if (!out.maxRunMillis || out.maxRunMillis > 600000 || !out.liveActionTimeoutMs || out.liveActionTimeoutMs > 60000 ||
        out.maxActions > 10000 || out.maxQueries > 10000 || out.maxEvents < 1 || out.maxEvents > 1000 ||
        out.maxGoalFailures > 1000 || out.maxInvalidations > 1000 || out.maxStagnantActions < 1 || out.intervalMs > 10000) throw new TypeError('Controller bounds exceeded');
    return Object.freeze(out);
  }
  function fail(code, message) { return Object.assign(new Error(message || code), { code }); }
  // Diagnostic only: equality decisions use the complete identities, never this bounded diff.
  function divergence(expected, actual, path, tagged = false) {
    let left, right;
    try {left=JSON.parse(expected);right=JSON.parse(actual);} catch(_) {return fail('HORIZON_EXECUTION_DIVERGED');}
    const stack=[[left,right,path]];let visited=0;
    const show=v=>{const t=JSON.stringify(v);return t===undefined?'missing':t.slice(0,180);};
    const ptr=(p,k)=>p+'/'+String(k).replace(/~/g,'~0').replace(/\//g,'~1');
    while(stack.length&&++visited<=20000){
      const [a,b,p]=stack.pop();if(Object.is(a,b))continue;
      if(tagged&&Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[0]==='object'){
        const x=new Map(a[1]),y=new Map(b[1]);
        for(const k of [...new Set([...x.keys(),...y.keys()])].sort().reverse()){
          if(x.has(k)!==y.has(k))return Object.assign(fail('HORIZON_EXECUTION_DIVERGED'),{path:ptr(p,k),details:{expected:show(x.get(k)),actual:show(y.get(k))}});
          stack.push([x.get(k),y.get(k),ptr(p,k)]);
        }continue;
      }
      if(tagged&&Array.isArray(a)&&Array.isArray(b)&&a[0]===b[0]&&a[0]==='array'){
        if(a[1].length!==b[1].length)return Object.assign(fail('HORIZON_EXECUTION_DIVERGED'),{path:p+'/length',details:{expected:String(a[1].length),actual:String(b[1].length)}});
        for(let i=a[1].length-1;i>=0;i--)stack.push([a[1][i],b[1][i],ptr(p,i)]);continue;
      }
      if(!tagged&&a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
        for(const k of [...new Set([...Object.keys(a),...Object.keys(b)])].sort().reverse())stack.push([a[k],b[k],ptr(p,k)]);continue;
      }
      if(JSON.stringify(a)!==JSON.stringify(b))return Object.assign(fail('HORIZON_EXECUTION_DIVERGED'),{path:p,details:{expected:show(a),actual:show(b)}});
    }
    return Object.assign(fail('HORIZON_EXECUTION_DIVERGED','Complete successor identity differs; diagnostic walk bounded'),{path});
  }
  function selectSequence(result) {
    if (!result || result.schemaVersion !== 1 || result.policy !== POLICY) throw fail('HORIZON_UNVERIFIED_RESULT','Missing zero-loss policy');
    const sequence = result.status === 'GOAL_REACHED' ? result.plan :
      ['SAFE_PREFIX_FOUND','SEARCH_BUDGET_EXHAUSTED','NO_SOLUTION_WITHIN_HORIZON'].includes(result.status) ? result.prefix : null;
    if (!sequence) return null;
    if (!Array.isArray(sequence.actions) || !Array.isArray(sequence.steps) || sequence.actions.length > 64 ||
        sequence.steps.length !== sequence.actions.length || sequence.decisions !== sequence.actions.length || sequence.healthLoss !== 0) throw fail('HORIZON_UNVERIFIED_RESULT','Malformed safe sequence');
    for (let i=0;i<sequence.actions.length;i++) {
      const a = sequence.actions[i], step = sequence.steps[i];
      const legal = a && (a.type === 'Move' ? Object.keys(a).sort().join(',') === 'direction,type' && ['up','right','down','left'].includes(a.direction) :
        Object.keys(a).join(',') === 'type' && ['LadderConfirm','LadderCancel','DismissInteraction'].includes(a.type));
      if (!legal || !step || Core.canonical(a) !== Core.canonical(step.action) || step.healthLoss !== 0 ||
          !Number.isFinite(step.turnDelta) || step.turnDelta < 0) throw fail('HORIZON_UNVERIFIED_RESULT','Unsupported action or missing per-edge metric');
    }
    return sequence;
  }
  function create({ source, planner, selector = Goals.createLocalSelector(), options = {}, planOptions = {}, onEvent = () => {} } = {}) {
    if (typeof source !== 'function' || typeof selector !== 'function' || typeof onEvent !== 'function') throw new TypeError('source, selector and onEvent must be functions');
    const config = optionsFor(options), searchConfig = Object.freeze(Core.optionsFor({ ...PLAN_DEFAULTS, ...planOptions }));
    const ownedPlanner = !planner;
    planner = planner || Host.create({ source });
    if (typeof planner.planForExecution !== 'function') throw new Error('Rebuild/reload: host.planForExecution is required');
    let active = null, disposed = false, quarantined = false, last = null;
    // Exploration history belongs to this controller/world, not one bounded
    // Run press. Rewind or episode changes reset it below.
    let exploration = { key: null, lastStep: -1, visits: {} };
    const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
    function snapshot(run) {
      return copy({ version: VERSION, assistance: 'privileged-oracle-live', state: run.state, reason: run.reason,
        goal: run.goal, counters: run.counts, elapsedMs: Math.round(now()-run.started),
        options: config, planOptions: searchConfig, source: run.metadata,
        lastPlan: run.lastPlan, lastTransition: run.lastTransition, error: run.error,
        events: run.events, droppedEvents: run.dropped, quarantined });
    }
    function emit(run, type, data = {}) {
      const event = { sequence: ++run.eventId, elapsedMs: Math.round(now()-run.started), type, ...copy(data) };
      run.events.push(event); if (run.events.length > config.maxEvents) { run.events.shift(); run.dropped++; }
      last = snapshot(run);
      try { onEvent(copy(last), copy(event)); } catch (_) { /* observers cannot control execution by throwing */ }
    }
    function finish(run, state, reason, error = null) {
      run.state = state; run.reason = reason; run.error = error ? Core.errorSummary(error) : null;
      emit(run, 'finished', { state, reason }); return snapshot(run);
    }
    function stop(reason = 'user-stop') {
      if (!active) return;
      active.stopReason = String(reason).slice(0,128); active.abort.abort();
      planner.cancel?.(); active.state = 'STOPPING'; emit(active,'stop-requested',{ inFlight: active.inFlight });
    }
    function checkSource(run) {
      if (source() !== run.live) throw fail('HORIZON_SOURCE_CHANGED','Live frame changed; initialize a fresh controller');
      const v = run.live.observe();
      if (v.seed !== run.metadata.seed || v.scenario !== run.metadata.scenario || v.steps < run.lastStep ||
          Core.canonical(v.contract) !== run.contract) throw fail('HORIZON_EPISODE_CHANGED','Episode/build/settings changed during the run');
      return v;
    }
    function checkPrecondition(run, witness) {
      const v = checkSource(run);
      return v.ready === true && Core.canonical(run.live.getPlanningGuard()) === witness.rootGuard && Host.viewIdentity(v) === witness.rootView;
    }
    async function delay(run) {
      if (!config.intervalMs || run.abort.signal.aborted) return;
      await new Promise(resolve => { let timer; const done = () => { clearTimeout(timer); run.abort.signal.removeEventListener('abort',done); resolve(); };
        timer=setTimeout(done,config.intervalMs); run.abort.signal.addEventListener('abort',done,{once:true}); });
    }
    function cancelled(run) {
      if (now()-run.started >= config.maxRunMillis) {run.stopReason='run-time-budget';run.abort.abort();planner.cancel?.();}
      return run.abort.signal.aborted;
    }
    async function execute(run, action, proof) {
      // No yield between the final cancellation/precondition check and admission to ordinary step().
      if (cancelled(run)) throw fail('HORIZON_CANCELLED');
      if (!checkPrecondition(run,proof)) throw fail('HORIZON_STALE_STATE');
      run.inFlight = 'live-action'; run.state = 'EXECUTING';
      emit(run,'dispatch',{ action });
      if (cancelled(run)) throw fail('HORIZON_CANCELLED');
      const started=now(); let timer;
      const task = Promise.resolve().then(() => {
        if (cancelled(run)) throw fail('HORIZON_CANCELLED');
        if (!checkPrecondition(run,proof)) throw fail('HORIZON_STALE_STATE');
        if (cancelled(run)) throw fail('HORIZON_CANCELLED');
        run.counts.dispatches++;
        return run.live.stepForHorizon(copy(action), { guard: proof.rootGuard, view: proof.rootView, signal: run.abort.signal,
          maxDispatchDelayMs: Math.max(0, config.maxRunMillis-(now()-run.started)) });
      });
      // Do not release ownership if the admitted action's fate is unknown. A fresh frame is required.
      try {
        const result = await Promise.race([task,new Promise((_,reject) => { timer=setTimeout(() => reject(fail('HORIZON_LIVE_ACTION_TIMEOUT')),config.liveActionTimeoutMs); })]);
        if (now()-started >= config.liveActionTimeoutMs) throw fail('HORIZON_LIVE_ACTION_TIMEOUT');
        return result;
      } catch(error) {
        if (!['HORIZON_STALE_STATE','HORIZON_CANCELLED','AGENT_ACTION_REJECTED'].includes(error.code)) { quarantined=true; run.abort.abort(); }
        throw error;
      } finally { clearTimeout(timer); run.inFlight=null; }
    }
    async function work(run, manualGoal, actionLimit) {
      const live=run.live, deadline = setTimeout(() => { run.stopReason='run-time-budget'; run.abort.abort(); planner.cancel?.(); }, config.maxRunMillis);
      try {
        for (const name of ['observe','getPlanningGuard','getHorizonExecutionCapabilities','stepForHorizon','inspectHorizonRoom']) if (typeof live[name] !== 'function') throw fail('HORIZON_BUILD_MISMATCH','Missing agent.'+name);
        const cap=live.getHorizonExecutionCapabilities();
        if (cap.version!==1 || cap.mode!=='ordinary-agent-step' || cap.metric!==METRIC || cap.precondition!=='dispatch-guard-v1') throw fail('HORIZON_BUILD_MISMATCH');
        let view=live.observe(); run.metadata={ seed:view.seed, scenario:view.scenario, contract:copy(view.contract) };
        const explorationKey=Core.canonical({seed:view.seed,scenario:view.scenario,contract:view.contract});
        if(exploration.key!==explorationKey || view.steps<exploration.lastStep)
          exploration={key:explorationKey,lastStep:view.steps,visits:{}};
        run.visits=exploration.visits;
        run.contract=Core.canonical(view.contract); run.lastStep=view.steps;
        if (manualGoal) run.goal=run.manualGoal=Host.validateGoal(manualGoal,view);
        emit(run,'started');
        while (true) {
          if (run.abort.signal.aborted || now()-run.started>=config.maxRunMillis) return finish(run,run.stopReason==='run-time-budget'?'BUDGET_EXHAUSTED':'STOPPED',run.stopReason || 'cancelled');
          view=checkSource(run);
          if (view.terminated) return finish(run,'COMPLETED','episode-terminated');
          if (view.truncated) return finish(run,'BUDGET_EXHAUSTED','episode-budget');
          if (!view.ready) return finish(run,'BLOCKED','agent-not-ready');
          if (run.counts.actions>=actionLimit) return finish(run,'BUDGET_EXHAUSTED','action-budget');
          if (run.counts.queries>=config.maxQueries || run.counts.simulations>=config.maxSimulations) return finish(run,'BUDGET_EXHAUSTED','search-budget');
          if (run.goal && run.goal.roomId!==view.room.id) {
            if (run.manualGoal) return finish(run,'BLOCKED','manual-goal-origin-changed');
            run.goal=null;
          }
          if (!run.goal) {
            run.state='SELECTING';
            const geometry=live.inspectHorizonRoom();
            const selected=selector({ view:copy(view), geometry:copy(geometry), visits:copy(run.visits), excluded:[...run.excluded] });
            if (selected && typeof selected.then==='function') throw fail('HORIZON_SELECTOR_ASYNC','Goal selector must be synchronous and bounded');
            if (!selected) return finish(run,'BLOCKED','no-local-goal');
            run.goal=Host.validateGoal(selected.goal,view); run.stagnant=0;
            emit(run,'goal',{ goal:run.goal, label:String(selected.label || 'Explicit local goal').slice(0,180) });
          }
          const anchor={ rootGuard:Core.canonical(live.getPlanningGuard()), rootView:Host.viewIdentity(view) };
          const remaining=config.maxSimulations-run.counts.simulations;
          const budget={ ...searchConfig, maxSimulations:Math.min(searchConfig.maxSimulations,remaining),
            maxMillis:Math.max(1,Math.min(searchConfig.maxMillis || config.maxRunMillis,config.maxRunMillis-Math.ceil(now()-run.started))) };
          run.state='PLANNING'; run.inFlight='planning'; run.counts.queries++;
          emit(run,'planning',{ query:run.counts.queries, goal:run.goal });
          const queryTask=planner.planForExecution(run.goal,budget,{signal:run.abort.signal});
          let queryAbort;
          const interrupted=new Promise((_,reject)=>{
            queryAbort=()=>reject(fail('HORIZON_QUERY_CANCELLED'));
            run.abort.signal.addEventListener('abort',queryAbort,{once:true});
            if(run.abort.signal.aborted)queryAbort();
          });
          let result;
          try { result=await Promise.race([queryTask,interrupted]); }
          catch(error) { run.counts.simulations+=budget.maxSimulations; throw error; }
          finally {run.abort.signal.removeEventListener('abort',queryAbort);run.inFlight=null;}
          if(now()-run.started>=config.maxRunMillis){run.stopReason='run-time-budget';run.abort.abort();}
          const used=result?.stats?.simulations;
          if (used!==undefined && (!Number.isSafeInteger(used) || used<0 || used>budget.maxSimulations)) throw fail('HORIZON_ACCOUNTING_INVALID');
          run.counts.simulations += used===undefined ? budget.maxSimulations : used;
          run.lastPlan={ status:result?.status || 'INVALID', stopReason:String(result?.stopReason || '').slice(0,256),
            simulations:used===undefined?null:used, path:[], goal:copy(run.goal),
            candidates:Array.isArray(result?.candidateLedger)?copy(result.candidateLedger.slice(-128)):[],
            candidateLedgerTruncated:result?.candidateLedgerTruncated===true };
          if (run.abort.signal.aborted) continue;
          if (!checkPrecondition(run,anchor)) { invalidate(run); continue; }
          if (!['GOAL_REACHED','SAFE_PREFIX_FOUND','SEARCH_BUDGET_EXHAUSTED','NO_SOLUTION_WITHIN_HORIZON'].includes(result?.status)) {
            return finish(run,'BLOCKED',result?.status || 'invalid-planner-result',result?.error || null);
          }
          if (Core.canonical(result.goal)!==Core.canonical(run.goal)) throw fail('HORIZON_GOAL_MISMATCH');
          const seq=selectSequence(result);
          if (!seq || !seq.actions.length) {
            if (result.status==='GOAL_REACHED' && Host.goalReached({view},run.goal,null)) {
              run.counts.goals++; if (manualGoal) return finish(run,'COMPLETED','goal-reached');
            } else {
              run.counts.goalFailures++; run.excluded.add(Goals.goalKey(run.goal));
              emit(run,'no-safe-prefix',{ status:result.status });
              if (manualGoal || run.counts.goalFailures>=config.maxGoalFailures) return finish(run,'BLOCKED','no-safe-prefix');
            }
            run.goal=null; continue;
          }
          const proof=result.execution, first=seq.actions[0];
          if (!proof || proof.schemaVersion!==1 || proof.source!=='horizon-first-edge-v1' || proof.metric!==METRIC || proof.healthLoss!==0 ||
              proof.rootGuard!==anchor.rootGuard || proof.rootView!==anchor.rootView || Core.canonical(proof.action)!==Core.canonical(first) ||
              proof.turnDelta!==seq.steps[0].turnDelta || typeof proof.afterGuard!=='string' || !proof.afterGuard ||
              typeof proof.afterView!=='string' || !proof.afterView) throw fail('HORIZON_UNVERIFIED_RESULT','Missing or inconsistent first-edge witness');
          if (!Host.actionsFor({view},run.goal).some(a=>Core.canonical(a)===Core.canonical(first))) throw fail('HORIZON_UNVERIFIED_RESULT','Action not allowed in current decision');
          run.lastPlan.path=copy(seq.actions); run.lastPlan.kind=result.status==='GOAL_REACHED'?'plan':'prefix';
          emit(run,'verified-plan',{ status:result.status, length:seq.actions.length, firstAction:first });
          let executed;
          try { executed=await execute(run,first,proof); }
          catch(error) {
            if (error.code==='HORIZON_STALE_STATE' || (error.code==='AGENT_ACTION_REJECTED' && !checkPrecondition(run,proof))) { invalidate(run); continue; }
            if (error.code==='HORIZON_CANCELLED') { cancelled(run); run.abort.abort(); continue; }
            throw error;
          }
          // Cancellation after admission must not hide a safety failure in the completed action.
          run.counts.actions++;
          const actual=executed.horizon;
          if (!actual || actual.schemaVersion!==1 || actual.metric!==METRIC || !Number.isFinite(actual.healthLoss) || actual.healthLoss<0) throw fail('HORIZON_METRIC_UNKNOWN');
          run.counts.grossHealthLoss+=actual.healthLoss;
          const after=checkSource(run);
          run.lastTransition={ action:copy(first), from:{roomId:view.room.id,...copy(view.player)},
            to:{roomId:after.room.id,...copy(after.player)}, healthLoss:actual.healthLoss,
            turnDelta:executed.info?.turnDelta ?? null, recorded:executed.info?.recorded===true, parity:false };
          if (actual.healthLoss!==0) throw fail('HORIZON_SAFETY_VIOLATION','Actual action lost health; halt without rollback');
          if (actual.dispatched!==true || executed.info?.recorded!==true || executed.terminated || executed.info?.turnDelta!==proof.turnDelta) {
            throw Object.assign(fail('HORIZON_EXECUTION_DIVERGED','Recorded/terminal/turn metrics differ from evaluated edge'),{path:'/execution/metrics'});
          }
          const actualView=Host.viewIdentity(after), actualGuard=Core.canonical(live.getPlanningGuard());
          if(actualView!==proof.afterView)throw divergence(proof.afterView,actualView,'/observation');
          if(actualGuard!==proof.afterGuard)throw divergence(proof.afterGuard,actualGuard,'/guard',true);
          run.lastTransition.parity=true; run.counts.verifiedActions++; run.lastStep=after.steps;
          run.excluded.clear(); // A failed goal in the old state is not a permanently forbidden tile.
          if (after.room.id!==view.room.id) {
            if(run.goal && run.goal.kind==='exit') {
              const departed=Goals.key(view.room.id,run.goal.x,run.goal.y,run.goal.z);
              run.visits[departed]=(run.visits[departed]||0)+1;
            }
            const geometry=live.inspectHorizonRoom();
            for (const entry of Goals.arrivalExitKeys({view:copy(after),geometry:copy(geometry)}))
              run.visits[entry]=(run.visits[entry]||0)+1;
          }
          const place=Goals.key(after.room.id,after.player.x,after.player.y,after.player.z);
          run.visits[place]=(run.visits[place]||0)+1;
          exploration.lastStep=after.steps;
          emit(run,'executed',run.lastTransition);
          const reached=Host.goalReached({view:after},run.goal,{from:{view},action:first});
          if (reached) {
            run.counts.goals++; emit(run,'goal-reached',{goal:run.goal});
            if (manualGoal) return finish(run,'COMPLETED','goal-reached');
            run.goal=null; run.stagnant=0;
          } else {
            const distance=v=>Math.abs(v.player.x-run.goal.x)+Math.abs(v.player.y-run.goal.y);
            run.stagnant=distance(after)<distance(view)?0:run.stagnant+1;
            if (run.stagnant>=config.maxStagnantActions) return finish(run,'BLOCKED','bounded-stagnation');
          }
          // Deliberately discard the remaining suffix after ONE committed edge.
          await delay(run);
        }
      } catch(error) {
        if(error.code==='HORIZON_QUERY_CANCELLED')return finish(run,run.stopReason==='run-time-budget'?'BUDGET_EXHAUSTED':'STOPPED',run.stopReason || 'cancelled');
        if (['HORIZON_METRIC_UNKNOWN','HORIZON_SAFETY_VIOLATION','HORIZON_EXECUTION_DIVERGED'].includes(error.code)) quarantined=true;
        return finish(run,'BLOCKED',error.code || 'execution-error',error);
      }
      finally { clearTimeout(deadline); planner.cancel?.(); if (!quarantined && leases.get(live)===run) leases.delete(live); }
    }
    function invalidate(run) {
      run.counts.invalidations++; run.lastPlan=null; run.goal=run.manualGoal; run.excluded.clear();
      emit(run,'invalidated',{ count:run.counts.invalidations });
      if (run.counts.invalidations>config.maxInvalidations) throw fail('HORIZON_INVALIDATION_BUDGET');
    }
    function start({ goal = null, singleAction = false } = {}) {
      if (disposed || quarantined) return Promise.reject(fail('HORIZON_RELOAD_REQUIRED'));
      if (active) return Promise.reject(fail('HORIZON_BUSY'));
      const live=source();
      if (!live || leases.has(live)) return Promise.reject(fail('HORIZON_BUSY','Another live controller owns this agent'));
      const run={ live, abort:new AbortController(), started:now(), state:'IDLE', reason:null, stopReason:null,
        metadata:null, contract:null, lastStep:0, goal:null, manualGoal:null, lastPlan:null, lastTransition:null, error:null,
        counts:{actions:0,dispatches:0,verifiedActions:0,queries:0,simulations:0,goals:0,goalFailures:0,invalidations:0,grossHealthLoss:0},
        events:[],eventId:0,dropped:0,visits:null,excluded:new Set(),stagnant:0,inFlight:null };
      active=run; leases.set(live,run);
      const task=Promise.resolve().then(()=>work(run,goal,singleAction?Math.min(1,config.maxActions):config.maxActions));
      return task.finally(()=>{ if(active===run)active=null; });
    }
    return Object.freeze({ start, stop, failureReproduction: () => planner.failureReproduction?.() || null, snapshot:()=>last?copy(last):{version:VERSION,state:'IDLE',quarantined},
      get running(){return !!active;}, dispose(){disposed=true;stop('disposed'); if(ownedPlanner)planner.dispose?.();} });
  }
  return { VERSION, DEFAULTS, PLAN_DEFAULTS, optionsFor, selectSequence, create };
});
