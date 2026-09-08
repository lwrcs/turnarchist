/* Browser-backed evaluation. Policy never receives diagnostic step observations. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./agent-baseline.js'):root.AgentBaseline);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.AgentBatch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function({Policy,source}){
  const validBudget=n=>Number.isInteger(n)&&n>=1&&n<=10000;
  const stateIdentity=view=>JSON.stringify([view.contract,view.vision,view.player,view.inventory,
    view.room,view.decision,view.selectionChoices,view.terminated]);
  const replayIdentity=envelope=>JSON.stringify([envelope.seed,envelope.steps,envelope.scenario,envelope.replay?.actions]);
  class Runner {
    constructor(agent){this.agent=agent;this.running=false;this.stopping=false;this.report=null;this.lastEpisode=null;}
    stop(){this.stopping=true;}
    async advance(episode,limit,onProgress) {
      const {policy,run,visited,rooms}=episode;
      let view=episode.view;
      try {
        while(run.decisions<limit&&!this.stopping) {
          if(view.terminated){run.status='dead';break;}
          const action=policy.choose(view);
          if(!action){run.status='unsupported-decision';break;}
          const policyDecision=policy.inspect?.()??null;
          const result=await this.agent.step(action);
          const next=this.agent.perceive();
          policy.feedback(view,action,next,result.info);
          run.decisions++;run.turns+=result.info.turnDelta;
          run.healthLost+=Math.max(0,view.player.health-next.player.health);
          episode.zeroTurnStreak=result.info.turnDelta===0?episode.zeroTurnStreak+1:0;
          if(result.info.turnDelta===0)run.zeroTurnDecisions++;
          run.maxZeroTurnStreak=Math.max(run.maxZeroTurnStreak,episode.zeroTurnStreak);
          if(result.info.recorded)run.recordedActions++;
          const position=`${next.room.id}:${next.player.x},${next.player.y},${next.player.z}`;
          run.decisionsSinceNewPosition=visited.has(position)?run.decisionsSinceNewPosition+1:0;
          run.maxDecisionsWithoutNewPosition=Math.max(run.maxDecisionsWithoutNewPosition,run.decisionsSinceNewPosition);
          visited.add(position);rooms.add(next.room.id);run.roomsVisited=rooms.size;
          run.trace.push({decision:run.decisions,action,policy:policyDecision,
            info:{recorded:result.info.recorded,turnDelta:result.info.turnDelta},before:view,after:next});
          if(run.trace.length>32)run.trace.shift();
          view=episode.view=next;run.finalHealth=view.player.health;run.visitedPositions=visited.size;
          onProgress({seed:run.seed,run:this.report.runs.length,total:this.report.seeds.length,
            decisions:run.decisions,health:view.player.health});
          if(result.terminated){run.status='dead';break;}
          if(result.truncated){run.status='budget-incomplete';break;}
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        if(run.status==='running')run.status=this.stopping?'cancelled':'budget-incomplete';
        run.replay=this.agent.exportReplay();
      } catch(error) {
        run.status='error';run.error=String(error);
        try{run.replay=this.agent.exportReplay();}catch{}
      }
    }
    finish() {
      this.report.finishedAt=new Date().toISOString();this.report.cancelled=this.stopping;
      this.report.completedSeeds=this.report.runs.filter(r=>r.status!=='running').length;
      this.running=false;
    }
    async run({seeds,decisions=100,scenario='standard',onProgress=()=>{}}) {
      if(this.running)throw new Error('Batch already running');
      if(!Array.isArray(seeds)||seeds.length<1||seeds.length>50||seeds.some(s=>!Number.isInteger(s)||s<0||s>0xffffffff))throw new Error('Provide 1..50 uint32 seeds');
      if(!validBudget(decisions))throw new Error('decisions must be 1..10000');
      this.running=true;this.stopping=false;this.lastEpisode=null;
      const report=this.report={schemaVersion:3,source:'programmed-policy-evaluation',policy:Policy.version,
        backend:'browser',scenario,policySource:source,seeds:[...seeds],decisionsPerSeed:decisions,startedAt:new Date().toISOString(),runs:[]};
      try {
        for(const seed of seeds) {
          if(this.stopping)break;
          const run={seed,status:'running',decisionBudget:decisions,decisions:0,turns:0,recordedActions:0,trace:[]};
          report.runs.push(run);
          try {
            this.lastEpisode=null;
            await this.agent.reset(seed,{maxSteps:decisions,scenario});
            const view=this.agent.perceive();
            Object.assign(run,{contract:view.contract,vision:view.vision,initialHealth:view.player.health,
              finalHealth:view.player.health,roomsVisited:1,decisionsSinceNewPosition:0,
              maxDecisionsWithoutNewPosition:0,healthLost:0,zeroTurnDecisions:0,maxZeroTurnStreak:0});
            const episode=this.lastEpisode={policy:new Policy(),run,view,visited:new Set(),rooms:new Set([view.room.id]),zeroTurnStreak:0};
            await this.advance(episode,decisions,onProgress);
          } catch(error) {
            run.status='error';run.error=String(error);
            try{run.replay=this.agent.exportReplay();}catch{}
          }
          // An error may leave pending callbacks. Never reset another seed over it.
          if(run.status==='error'||this.stopping)break;
        }
      } finally {this.finish();}
      return report;
    }
    async resumeLast({decisions=100,onProgress=()=>{}}={}) {
      if(this.running)throw new Error('Batch already running');
      if(!validBudget(decisions))throw new Error('decisions must be 1..10000');
      const episode=this.lastEpisode;
      if(!episode||!['budget-incomplete','cancelled'].includes(episode.run.status))throw new Error('No resumable last run');
      const current=this.agent.perceive();
      if(current.terminated||stateIdentity(current)!==stateIdentity(episode.view))
        throw new Error('The game changed since this run stopped; start a new batch');
      if(replayIdentity(this.agent.exportReplay())!==replayIdentity(episode.run.replay))
        throw new Error('Replay history changed since this run stopped; start a new batch');
      // Extend only after validation. No reset, implicit Wait, or reconstructed policy.
      this.agent.extendBudget(decisions);
      episode.view=this.agent.perceive();
      const limit=episode.run.decisions+decisions;
      episode.run.resumptions??=[];
      episode.run.resumptions.push({atDecision:episode.run.decisions,additionalDecisions:decisions,
        previousStatus:episode.run.status,at:new Date().toISOString()});
      episode.run.decisionBudget=limit;episode.run.status='running';
      this.running=true;this.stopping=false;
      try {await this.advance(episode,limit,onProgress);} finally {this.finish();}
      return this.report;
    }
  }
  return {Runner};
});
