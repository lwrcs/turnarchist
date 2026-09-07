/* Browser-backed evaluation. Policy never receives diagnostic step observations. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./agent-baseline.js'):root.AgentBaseline);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.AgentBatch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function({Policy,source}){
  class Runner {
    constructor(agent){this.agent=agent;this.running=false;this.stopping=false;this.report=null;}
    stop(){this.stopping=true;}
    async run({seeds,decisions=100,onProgress=()=>{}}) {
      if(this.running)throw new Error('Batch already running');
      if(!Array.isArray(seeds)||seeds.length<1||seeds.length>50||seeds.some(s=>!Number.isInteger(s)||s<0||s>0xffffffff))throw new Error('Provide 1..50 uint32 seeds');
      if(!Number.isInteger(decisions)||decisions<1||decisions>10000)throw new Error('decisions must be 1..10000');
      this.running=true;this.stopping=false;
      const report=this.report={schemaVersion:1,source:'programmed-policy-evaluation',policy:Policy.version,
        backend:'browser',policySource:source,seeds:[...seeds],decisionsPerSeed:decisions,startedAt:new Date().toISOString(),runs:[]};
      try {
        for(const seed of seeds) {
          if(this.stopping)break;
          const policy=new Policy();
          const run={seed,status:'running',decisions:0,turns:0,recordedActions:0,trace:[]};
          report.runs.push(run);
          try {
            await this.agent.reset(seed,{maxSteps:decisions});
            let view=this.agent.perceive();
            run.contract=view.contract;run.vision=view.vision;run.initialHealth=view.player.health;
            const visited=new Set();
            const rooms=new Set([view.room.id]);
            run.finalHealth=view.player.health;run.roomsVisited=1;run.decisionsSinceNewPosition=0;
            while(run.decisions<decisions&&!this.stopping) {
              if(view.terminated){run.status='dead';break;}
              const action=policy.choose(view);
              if(!action){run.status='unsupported-decision';break;}
              const result=await this.agent.step(action);
              const next=this.agent.perceive();
              policy.feedback(view,action,next,result.info);
              run.decisions++;run.turns+=result.info.turnDelta;
              if(result.info.recorded)run.recordedActions++;
              const position=`${next.room.id}:${next.player.x},${next.player.y},${next.player.z}`;
              run.decisionsSinceNewPosition=visited.has(position)?run.decisionsSinceNewPosition+1:0;
              visited.add(position);rooms.add(next.room.id);run.roomsVisited=rooms.size;
              // Restricted snapshots only, bounded in the report; replay retains the action sequence.
              run.trace.push({decision:run.decisions,action,info:{recorded:result.info.recorded,turnDelta:result.info.turnDelta},before:view,after:next});
              if(run.trace.length>32)run.trace.shift();
              view=next;run.finalHealth=view.player.health;run.visitedPositions=visited.size;
              onProgress({seed,run:report.runs.length,total:seeds.length,decisions:run.decisions,health:view.player.health});
              if(result.terminated){run.status='dead';break;}
              if(result.truncated){run.status='budget-incomplete';break;}
              await new Promise(resolve=>setTimeout(resolve,0));
            }
            if(run.status==='running')run.status=this.stopping?'cancelled':'budget-incomplete';
            // Diagnostic replay envelope is an output artifact, never an input to the policy.
            run.replay=this.agent.exportReplay();
          } catch(error) {
            run.status='error';run.error=String(error);
            try{run.replay=this.agent.exportReplay();}catch{}
            // A timed-out environment may still have pending callbacks. Never reset over it.
            break;
          }
          if(this.stopping)break;
        }
      } finally {
        report.finishedAt=new Date().toISOString();report.cancelled=this.stopping;
        report.completedSeeds=report.runs.filter(r=>r.status!=='running').length;
        this.running=false;
      }
      return report;
    }
  }
  return {Runner};
});
