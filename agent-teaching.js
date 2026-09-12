/* Serialized teaching sessions. No DOM input reaches the game directly. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AgentTeaching=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const copy=x=>JSON.parse(JSON.stringify(x));
  const position=v=>JSON.stringify([v.room.id,v.player.x,v.player.y]);
  const effect=v=>JSON.stringify([v.player,v.inventory,v.room.entities,v.room.items,v.room.hitWarnings,v.decision,v.selectionChoices,v.vendingMachine]);
  const threatens=w=>w.hostile&&w.dangerous!==false;
  const actorFor=source=>source==='agent'?'model':source;
  function exportEnvelope(meta,records,replay){
    const resultMeta=copy(meta),policy=resultMeta.policy||'Unknown';
    resultMeta.policyType=resultMeta.policyType||'unknown';
    resultMeta.provenance=resultMeta.provenance||{actionActorField:'records[].actor',actionSourceField:'records[].source',sources:{human:'direct human input',agent:'policy/model output',helper:'policy output during a deterministic helper decision',rejected:'attempt rejected by the game; see requestedSource'},policy,policyType:resultMeta.policyType};
    const resultRecords=copy(records).map(record=>{const requested=record.requestedSource||record.info?.requestedSource||(record.source==='rejected'?'unknown':record.source);record.requestedSource=requested;record.actor=record.actor||actorFor(requested);return record;});
    return {schemaVersion:1,meta:resultMeta,records:resultRecords,...(replay===undefined?{}:{replay:copy(replay)})};
  }
  function allowedDirections(v){
    if(!['world','vending'].includes(v.decision))return [];
    const weapon=v.inventory.find(i=>i?.activeWeapon)?.traits;
    return ['up','right','down','left'].filter((direction,index)=>{
      const [dx,dy]=[[0,-1],[1,0],[0,1],[-1,0]][index],x=v.player.x+dx,y=v.player.y+dy;
      const tile=v.room.tiles.find(t=>t.x===x&&t.y===y);
      // Directional actions can also attack. Do not mask unknown terrain, doors,
      // wall-mounted torches/candles, breakable objects, or weapons whose reach
      // extends beyond this tile. Occupancy takes precedence over wall solidity.
      const occupied=v.room.entities.some(e=>x>=e.x&&x<e.x+(e.width||1)&&y>=e.y&&y<e.y+(e.height||1));
      return occupied||weapon?.attackPattern!=='adjacent-cardinal'||!tile?.solid||tile.isDoor||!['Wall','WallTorch'].includes(tile.kind);
    });
  }
  function availableActions(v){
    if(!v)return [];
    const actions=allowedDirections(v).map(direction=>({type:'Move',direction}));
    if(v.decision==='ladder')actions.push({type:'LadderConfirm'},{type:'LadderCancel'});
    else if(v.decision==='dismissable-interaction')actions.push({type:'DismissInteraction'});
    else if(v.decision==='vending')actions.push({type:'VendingMachineBuy'},{type:'DismissInteraction'});
    else if(v.decision==='selection')for(const choice of v.selectionChoices||[])if(choice.enabled)actions.push({type:'SelectOption',index:choice.index,label:choice.label});
    return actions;
  }
  function inspectSession(session,options={}){
    if(!session)return null;
    const records=session.records||[],view=session.view||null;
    return copy({
      id:session.meta?.id??null,
      name:session.meta?.name??null,
      seed:session.meta?.seed??null,
      mode:session.meta?.mode??null,
      state:session.state,
      reason:session.reason,
      busy:!!session.busy,
      inputOwner:!!options.inputOwner,
      displayView:options.displayView??null,
      recording:{actions:records.length,worldTurns:records.reduce((total,record)=>total+(Number(record.info?.turnDelta)||0),0),exported:!!options.exported},
      policy:{name:session.meta?.policy||session.policy?.name||'Unknown',type:session.meta?.policyType||session.policy?.kind||'unknown'},
      availableActions:availableActions(view),
      suggestion:session.suggested||null,
      observation:view
    });
  }
  function helper(v){
    if(v.decision==='ladder')return {type:'LadderConfirm'};
    if(v.decision==='dismissable-interaction')return {type:'DismissInteraction'};
    if(v.decision==='vending')return {type:'DismissInteraction'};
    if(v.decision==='selection'){const c=v.selectionChoices?.find(c=>c.enabled&&c.label==='Cancel');return c?{type:'SelectOption',index:c.index}:null;}
    if(v.decision!=='world')return null;
    if(v.player.health<v.player.maxHealth){const i=v.inventory.find(i=>i?.healingAmount>0&&!i.canUseOnOther&&i.useTurnCost===0);if(i)return {type:'UseItem',slotIndex:i.slot};}
    return null;
  }
  function stuck(records){
    const t=records.slice(-6);
    if(t.length<6||t.some(r=>r.source!=='agent'||r.action.type!=='Move'))return null;
    if(t.every(r=>!r.info.recorded&&r.info.turnDelta===0&&position(r.before)===position(r.after)&&effect(r.before)===effect(r.after)))return 'Repeated moves had no effect';
    const p=t.map(r=>position(r.after));
    if(p[0]!==p[1]&&p.every((v,i)=>v===p[i%2])&&t.every((r,i)=>r.info.recorded&&r.before.player.health===r.after.player.health&&
      !r.before.room.entities.some(e=>e.isEnemy||e.appearance==='unidentified')&&effect(r.after)===effect(t[i%2].after)))return 'Repeated position cycle without progress';
    return null;
  }
  class Store {
    constructor(){this.ready=new Promise((resolve,reject)=>{const r=indexedDB.open('turnarchist-teaching-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('sessions',{keyPath:'id'});r.result.createObjectStore('records',{keyPath:['session','seq']});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
    async transaction(store,value){const db=await this.ready;return new Promise((resolve,reject)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).put(value);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('Save aborted'));});}
    save(meta){return this.transaction('sessions',copy(meta));}
    append(id,r){return this.transaction('records',{session:id,...copy(r)});}
    async list(){const db=await this.ready;return new Promise((resolve,reject)=>{const r=db.transaction('sessions').objectStore('sessions').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
    async export(id){const db=await this.ready;const all=await this.list();const meta=all.find(s=>s.id===id);if(!meta)throw new Error('Session not found');return new Promise((resolve,reject)=>{const r=db.transaction('records').objectStore('records').getAll(IDBKeyRange.bound([id,0],[id,Number.MAX_SAFE_INTEGER]));r.onsuccess=()=>resolve(exportEnvelope(meta,r.result));r.onerror=()=>reject(r.error);});}
  }
  class Session {
    constructor({agent,policy,store,meta,onChange=()=>{}}){Object.assign(this,{agent,policy,store,onChange});this.meta={...meta,schemaVersion:1,events:[],excludedSegments:[]};this.records=[];this.state='ready';this.busy=false;this.humanActive=false;this.humanQueue=null;this.generation=0;this.segment=0;this.pending=null;this.reason='';this.suggested=null;this.autoReturn=false;this.speed=500;this.uncertain=false;this.view=null;this.tailIgnore=0;}
    changed(){this.agent.setFastMode?.(this.state==='agent'&&this.speed===0);this.onChange(this);}
    uiLayout(){return this.agent.getUiLayout?.()||null;}
    async setInventoryOpen(open){if(this.state!=='human'||this.busy)return false;this.agent.setInventoryOpen?.(open);this.view=copy(this.agent.perceive());this.changed();return true;}
    async start(mode){this.state='loading';this.changed();try{await this.agent.reset(this.meta.seed,{scenario:'standard',maxSteps:10000});this.view=copy(this.agent.perceive());this.meta.initial=this.view;this.meta.contract=this.view.contract;this.meta.mode=mode;this.meta.startedAt=new Date().toISOString();await this.policy?.reset?.(this.view,this.meta);this.meta.policy=this.policy?.name||this.meta.policy||'None';this.meta.policyType=this.policy?.kind||'unknown';this.meta.provenance={actionActorField:'records[].actor',actionSourceField:'records[].source',sources:{human:'direct human input',agent:'policy/model output',helper:'policy output during a deterministic helper decision',rejected:'attempt rejected by the game; see requestedSource'},policy:this.meta.policy,policyType:this.meta.policyType};await this.store.save(this.meta);this.state='paused';this.reason=mode==='demonstration'?'Ready: activate human controls':'Ready: start agent';this.changed();}catch(e){this.fail(e);}}
    fail(e){this.generation++;this.state='error';this.reason=String(e.message||e);this.changed();}
    async event(type){this.meta.events.push({type,atSeq:this.records.length,time:Date.now(),segment:this.segment});try{await this.store.save(this.meta);}catch(e){this.fail(e);return false;}return true;}
    pause(reason='Paused'){if(['finished','error'].includes(this.state))return;this.generation++;this.state='paused';this.reason=reason;this.autoDeadline=null;this.humanQueue=null;this.changed();}
    async take(){if(['error','finished','handoff','human'].includes(this.state)||!this.view)return;const generation=++this.generation;this.state='handoff';this.changed();if(this.pending)try{await this.pending;}catch{return;}if(this.state!=='handoff'||generation!==this.generation)return;this.segment++;if(!await this.event('human-control')||generation!==this.generation)return;this.state='human';this.reason='Your controls are active';this.interventionOrigin=position(this.view);this.suggested=null;this.changed();}
    async resume(single=false){if(this.busy||['error','finished','agent','handoff'].includes(this.state))return;const g=++this.generation;this.state='handoff';this.suggested=null;this.autoDeadline=null;this.changed();if(!await this.event('agent-control')||g!==this.generation)return;this.state='agent';this.reason='Agent controls the game';this.changed();while(this.state==='agent'&&g===this.generation){await this.agentStep(g);if(single&&this.state==='agent'){this.pause('Single agent step completed');break;}if(this.state==='agent'&&g===this.generation)await new Promise(r=>setTimeout(r,this.speed));}}
    async agentStep(g){
      if(this.busy||g!==this.generation)return;
      this.busy=true;this.changed();
      try{
        const automatic=helper(this.view),prediction=automatic?{action:automatic}:await this.policy.choose(this.view);
        if(g!==this.generation||this.state!=='agent')return;
        if(!prediction?.action){this.state='help';this.reason='Agent cannot handle this choice';return;}
        const modelDecision=automatic?null:{action:copy(prediction.action),probabilities:prediction.probabilities?Array.from(prediction.probabilities):null};
        if(prediction.action.type==='Move'){
          const allowed=allowedDirections(this.view);
          if(!allowed.includes(prediction.action.direction)){
            const probs=prediction.probabilities;
            if(!allowed.length||!probs){this.state='help';this.reason='Agent proposed a known blocked direction; choose an interaction or take control';return;}
            const directions=['up','right','down','left'];
            prediction.action={type:'Move',direction:allowed.reduce((best,d)=>probs[directions.indexOf(d)]>probs[directions.indexOf(best)]?d:best)};
          }
        }
        if(this.uncertain&&prediction.probabilities&&Math.max(...prediction.probabilities)<.4&&this.records.length>this.tailIgnore){this.state='help';this.reason='Agent choices are close (not a safety score)';return;}
        this.busy=false;await this.execute(prediction.action,automatic?'helper':'agent',{modelDecision});
        if(this.state==='agent'&&this.records.length>this.tailIgnore){const reason=stuck(this.records);if(reason){this.state='help';this.reason=reason;this.meta.events.push({type:'help-request',reason,atSeq:this.records.length});await this.store.save(this.meta);}}
      }catch(e){this.fail(e);}finally{this.busy=false;this.changed();}
    }
    async human(action){
      if(this.state!=='human')return false;
      if(this.humanActive){if(this.humanQueue)return false;this.humanQueue=copy(action);this.reason='Next input buffered';this.changed();return true;}
      this.humanActive=true;let next=action,accepted=false;
      try{while(next&&this.state==='human'){const current=next;next=null;if(current.type==='Move'&&!allowedDirections(this.view).includes(current.direction)){this.reason='That direction is a known solid wall or this menu needs a choice.';this.changed();}else{accepted=true;const modelSuggestion=this.suggested?copy(this.suggested):null;this.autoDeadline=null;await this.execute(current,'human',{modelSuggestion});if(this.state==='human')await this.propose();}if(this.state==='human'&&this.humanQueue){next=this.humanQueue;this.humanQueue=null;}}if(this.state==='human'&&this.reason==='Next input buffered')this.reason='Your controls are active';return accepted;
      }finally{this.humanActive=false;if(this.state!=='human')this.humanQueue=null;this.changed();}}
    async execute(action,source,decision={}){
      if(this.busy)throw new Error('Action already in flight');
      this.busy=true;this.changed();
      this.pending=(async()=>{
        const before=copy(this.view),displayView=source==='human'?(this.displayView||'grid'):null;let result,rejection=null;
        try{result=await this.agent.step(action);}catch(e){
          if(e.code!=='AGENT_ACTION_REJECTED')throw new Error('Game action failed; export this session before starting a new one: '+e.message);
          rejection=e.message;result={info:{recorded:false,turnDelta:0,rejection,requestedSource:source},terminated:false,truncated:false};
        }
        const after=copy(this.agent.perceive());
        const actor=actorFor(source);
        const record={seq:this.records.length+1,source:rejection?'rejected':source,requestedSource:source,actor,segment:this.segment,before,after,action:copy(action),info:copy(result.info),terminated:result.terminated,truncated:result.truncated,decisionEnd:after.decision==='world'&&!helper(after),time:Date.now()};
        if(decision.modelDecision)record.modelDecision=copy(decision.modelDecision);
        if(decision.modelSuggestion)record.modelSuggestion=copy(decision.modelSuggestion);
        record.displayView=displayView;
        this.records.push(record);this.view=after;
        await this.store.append(this.meta.id,record);await this.policy?.advance?.(record);
        if(rejection){this.state='help';this.reason=rejection+' — run preserved. Take control or try the agent again.';await this.event('action-rejected');}
        else if(result.terminated||result.truncated){this.state='finished';this.reason=result.terminated?'Run ended':'Decision budget reached';this.meta.endedAt=new Date().toISOString();await this.event('finished');}
      })();
      try{await this.pending;}catch(e){this.fail(e);}finally{this.busy=false;this.pending=null;this.changed();}
    }
    async propose(){if(this.busy||this.state!=='human'||this.meta.mode==='demonstration')return;const seq=this.records.length,g=this.generation;try{const p=await this.policy.propose?.(this.view);if(this.state!=='human'||seq!==this.records.length||g!==this.generation)return;const last=this.records.at(-1);const clear=!stuck(this.records)&&!this.view.room.hitWarnings.some(w=>threatens(w)&&w.x===this.view.player.x&&w.y===this.view.player.y);const useful=last&&(position(last.before)!==position(last.after)||effect(last.before)!==effect(last.after));const repeatsFailure=last&&!last.info.recorded&&JSON.stringify(last.action)===JSON.stringify(p?.action);this.suggested=p?.action&&clear&&useful&&!repeatsFailure?p:null;if(this.suggested&&this.autoReturn)this.autoDeadline=Date.now()+2000;this.changed();}catch(e){this.reason='Agent suggestion unavailable: '+e.message;this.changed();}}
    async finish(){this.pause('Finishing');if(this.pending)await this.pending;if(this.state==='error')return;this.state='finished';this.meta.endedAt=new Date().toISOString();await this.event('finished-by-human');this.changed();}
    async export(){return exportEnvelope(this.meta,this.records,this.cachedReplay??(!this.busy?this.agent.exportReplay():null));}
  }
  class Baseline {
    constructor(Policy){this.Policy=Policy;this.name='Programmed baseline';this.kind='programmed-baseline';}
    reset(){this.policy=new this.Policy();this.proposed=null;}
    clone(){const p=new this.Policy();Object.assign(p,structuredClone(this.policy));return p;}
    choose(v){this.proposed=this.clone();return {action:this.proposed.choose(v)};}
    advance(r){if(r.source==='human'||!this.proposed){this.proposed=this.clone();this.proposed.choose(r.before);}this.policy=this.proposed;this.proposed=null;this.policy.feedback(r.before,r.action,r.after,r.info);}
    propose(v){return {action:this.clone().choose(v)};}
  }
  class Remote {
    constructor(url,token){const parsed=new URL(url);if(parsed.protocol!=='http:'||!['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('Inference must use a local HTTP service');this.url=url.replace(/\/$/,'');this.token=token;this.queue=Promise.resolve();this.id=null;this.name='Learned checkpoint';this.kind='learned-checkpoint';}
    async request(path,body){const response=await fetch(this.url+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+this.token},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Inference unavailable');return result;}
    async reset(v,meta){const r=await this.request('/start',{view:v,meta});this.id=r.id;this.name=r.model;this.seq=0;meta.policy=r.model;meta.encoder=r.encoder;}
    async advance(record){const r=await this.request('/advance',{id:this.id,record});if(r.seq!==record.seq)throw new Error('Inference history mismatch');this.seq=r.seq;}
    async choose(){const r=await this.request('/predict',{id:this.id,seq:this.seq});if(r.seq!==this.seq)throw new Error('Stale prediction');return r;}
    propose(){return this.choose();}
  }
  return {Session,Store,Baseline,Remote,helper,stuck,allowedDirections,availableActions,inspectSession};
});
