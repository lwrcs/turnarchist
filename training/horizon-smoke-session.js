/* Diagnostic-only, bounded smoke operations. No game state or snapshot normalization. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HorizonSmokeSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const now = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
  function errorSummary(error) {
    const out = {name: String(error?.name || 'Error'), message: String(error?.message || error).slice(0, 3000)};
    for (const key of ['code', 'path']) if (typeof error?.[key] === 'string') out[key] = error[key].slice(0, 600);
    if (error?.details) { try { const text=JSON.stringify(error.details); out.details=text.length<=8000?JSON.parse(text):{truncated:true,preview:text.slice(0,8000)}; } catch {} }
    if (typeof error?.stack === 'string') out.stack = error.stack.slice(0, 6000);
    return out;
  }
  // Reading only own data descriptors avoids getters, canMove(), observe(), and fingerprint work.
  const data = (object, key) => object && typeof object === 'object' ? Object.getOwnPropertyDescriptor(object, key)?.value : undefined;
  function agentStatus(agent) {
    const game=data(agent,'game'), players=data(game,'players'), player=data(players,data(game,'localPlayerID'));
    const room=data(game,'room'), camera=data(game,'cameraAnimation');
    const out={available:!!agent, engineFieldsAvailable:!!game};
    const take=(name,value)=>{if(['boolean','string','number'].includes(typeof value))out[name]=typeof value==='string'?value.slice(0,240):value;};
    for(const key of ['busy','failure','seed','scenario','steps','maxSteps'])take(key,data(agent,key));
    for(const key of ['paused','started','levelState','transition','transitioningLadder','preLevelGenFadeActive','preLevelGenHoldBlack','preLevelGenActionStarted'])take(key,data(game,key));
    for(const key of ['dead','busyAnimating','roomGID','depth','x','y','z','turnCount'])take('player.'+key,data(player,key));
    take('room.id',data(room,'globalId'));take('room.turn',data(room,'turn'));take('camera.active',data(camera,'active'));
    take('screenMessage.open',data(data(player,'screenMessage'),'open'));
    const history=data(agent,'sandboxActionHistory');if(Array.isArray(history))out.recordedActions=history.length;
    return out;
  }
  function positive(value, name, maximum) {
    if(!Number.isSafeInteger(value)||value<1||value>maximum)throw new TypeError('Invalid '+name);
    return value;
  }
  function create({report, onProgress, probe, signal, caseTimeoutMs=180000, operationTimeoutMs=30000, clock=now}={}) {
    positive(caseTimeoutMs,'caseTimeoutMs',1800000);positive(operationTimeoutMs,'operationTimeoutMs',120000);
    if(onProgress!==undefined && typeof onProgress!=='function')throw new TypeError('onProgress must be a function');
    const started=clock(), controller=new AbortController();let sealed=false,seq=0, timer, active=null;
    report.elapsedMs=0;report.operations=[];report.completedOperations=0;
    report.validationBudgets={caseTimeoutMs,operationTimeoutMs,hostStepTimeoutMs:3000};
    function publish() {
      if(sealed)return;
      report.elapsedMs=Math.max(0,Math.round(clock()-started));report.sequence=++seq;
      if(probe){try{report.runtime=probe();}catch(error){report.runtime={diagnosticError:String(error?.message||error).slice(0,300)};}}
      if(onProgress){try{onProgress(copy(report));}catch(error){report.observerError=String(error?.message||error).slice(0,300);}}
    }
    function timeout(code, name, milliseconds, elapsed) {
      const error=new Error(code+': '+name+' exceeded '+milliseconds+' ms');error.code=code;error.path='/smoke/'+name;
      error.details={operation:name,budgetMs:milliseconds,elapsedMs:Math.round(elapsed),completedOperations:report.completedOperations};return error;
    }
    function cancelled() { const error=new Error('Smoke session cancelled');error.code='SMOKE_CANCELLED';return error; }
    const externalAbort=()=>controller.abort(signal?.reason || cancelled());
    if(signal?.aborted)externalAbort();else signal?.addEventListener('abort',externalAbort,{once:true});
    timer=setTimeout(()=>controller.abort(timeout('SMOKE_CASE_TIMEOUT',active?.name||report.phase,caseTimeoutMs,clock()-started)),caseTimeoutMs);
    function check() {
      if(sealed)throw new Error('Smoke session is already closed');
      if(controller.signal.aborted)throw controller.signal.reason || cancelled();
      if(clock()-started>=caseTimeoutMs)throw timeout('SMOKE_CASE_TIMEOUT',active?.name||report.phase,caseTimeoutMs,clock()-started);
    }
    async function operation(name, fn, budget=operationTimeoutMs) {
      check();positive(budget,'operation budget',1800000);
      if(active)throw new Error('Smoke operations cannot overlap');
      const begin=clock(), allowance=Math.min(budget,Math.max(1,caseTimeoutMs-(begin-started)));
      const info={name,startedMs:Math.round(begin-started),budgetMs:allowance};active=info;report.operation=info;publish();
      let opTimer,aborted;
      const stopped=new Promise((_,reject)=>{
        aborted=()=>reject(controller.signal.reason || cancelled());
        controller.signal.addEventListener('abort',aborted,{once:true});
        opTimer=setTimeout(()=>reject(timeout(allowance<budget?'SMOKE_CASE_TIMEOUT':'SMOKE_OPERATION_TIMEOUT',name,allowance,clock()-begin)),allowance);
      });
      try {
        const result=await Promise.race([Promise.resolve().then(()=>{check();return fn();}),stopped]);
        check();
        // A synchronous long task can resolve before its overdue timer is dispatched.
        if(clock()-begin>=allowance)throw timeout('SMOKE_OPERATION_TIMEOUT',name,allowance,clock()-begin);
        const done={...info,durationMs:Math.max(0,Math.round(clock()-begin)),pass:true};
        report.operations.push(done);report.completedOperations++;report.lastOperation=done;delete report.operation;return result;
      } catch(error) {
        const done={...info,durationMs:Math.max(0,Math.round(clock()-begin)),pass:false,error:errorSummary(error)};
        report.operations.push(done);report.lastOperation=done;report.operation=done;
        controller.abort(error);throw error;
      } finally {
        clearTimeout(opTimer);controller.signal.removeEventListener('abort',aborted);active=null;publish();
      }
    }
    function finish(error) {
      if(sealed)return copy(report);
      if(!error && clock()-started>=caseTimeoutMs) error=timeout('SMOKE_CASE_TIMEOUT',active?.name||report.phase,caseTimeoutMs,clock()-started);
      if(error){report.pass=false;report.status=report.status==='INCONCLUSIVE'?'INCONCLUSIVE':'FAIL';report.error=errorSummary(error);}
      else if(controller.signal.aborted){report.pass=false;report.status='FAIL';report.error=errorSummary(controller.signal.reason || cancelled());}
      publish();sealed=true;clearTimeout(timer);signal?.removeEventListener('abort',externalAbort);return copy(report);
    }
    return {operation,publish,finish,signal:controller.signal,cancel:()=>controller.abort(cancelled()),
      status:()=>copy(report),check};
  }
  return {create,errorSummary,agentStatus};
});
