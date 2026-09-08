/* Programmed baseline: consumes only the restricted perception contract. */
(function(root, factory) {
  const api=factory(); api.source=factory.toString();
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.AgentBaseline=api;
})(typeof globalThis!=='undefined'?globalThis:this, function() {
  const directions=[['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]];
  const key=(x,y)=>`${x},${y}`;
  const occupies=(e,x,y)=>x>=e.x&&y>=e.y&&x<e.x+Math.max(1,e.width??1)&&y<e.y+Math.max(1,e.height??1);
  class Policy {
    static version='explore-combat-v19';
    constructor(){this.visits=new Map();this.blocked=new Map();this.crossings=new Map();this.tick=0;this.maps=new Map();this.obstacles=new Map();this.doorUses=new Map();this.goal=null;this.reason=null;this.connections=new Map();this.roomWork=new Map();}
    connect(from,door,to) {
      if(!this.connections.has(from))this.connections.set(from,new Map());
      this.connections.get(from).set(door,to);
    }
    backtrack(scope,passages) {
      const queue=[],seen=new Set([scope]);
      for(const passage of passages) {
        const room=this.connections.get(scope)?.get(passage.key);
        if(room&&!seen.has(room)){seen.add(room);queue.push({room,first:passage});}
      }
      for(let i=0;i<queue.length;i++) {
        const node=queue[i];
        if(this.roomWork.get(node.room))return {...node.first,backtrack:true,targetRoom:node.room};
        for(const [door,room] of this.connections.get(node.room)??[]) {
          if(seen.has(room))continue;
          const tile=this.maps.get(node.room)?.get(door);
          if(tile?.exit&&tile.traversal?.direction==='up'&&tile.traversal.unlocked===false)continue;
          if(tile?.traversal?.tunnel&&!tile.traversal.unlocked&&tile.traversal.unlockFromHere===false)continue;
          const [x,y]=door.split(',').map(Number);
          if([...this.obstacles.get(node.room)?.values()??[]].some(e=>occupies(e,x,y)&&e.collidable&&!e.destroyable))continue;
          seen.add(room);queue.push({room,first:node.first});
        }
      }
      return null;
    }
    canPushIntoSpace(view,x,y,dx,dy) {
      const tiles=new Map(view.room.tiles.map(t=>[key(t.x,t.y),t]));
      const head=view.room.entities.find(e=>occupies(e,x,y));
      // Complex footprints/crush tails remain uncertain; confirm only a visible clear chain.
      if(!head?.pushable||(head.width??1)!==1||(head.height??1)!==1)return false;
      for(let steps=0;steps<=view.room.entities.length;steps++) {
        x+=dx;y+=dy;
        const tile=tiles.get(key(x,y));
        if(tile?.solid!==false||tile.isDoor||tile.exit)return false;
        const next=view.room.entities.filter(e=>occupies(e,x,y));
        if(next.length===0)return true;
        if(next.some(e=>e.chainPushable!==true||(e.width??1)!==1||(e.height??1)!==1))return false;
      }
      return false;
    }
    leavesThreatLane(view,x,y) {
      const p=view.player;
      const sources=new Set(view.room.hitWarnings.filter(w=>w.hostile&&w.x===p.x&&w.y===p.y&&w.sourceId).map(w=>w.sourceId));
      let count=0;
      for(const e of view.room.entities) {
        if(!sources.has(e.id)||!e.isEnemy)continue;
        const w=Math.max(1,e.width??1),h=Math.max(1,e.height??1);
        // Use the visible body's current alignment, not a species behavior model.
        if(p.x>=e.x&&p.x<e.x+w&&(p.y<e.y||p.y>=e.y+h)&&(x<e.x||x>=e.x+w))count++;
        else if(p.y>=e.y&&p.y<e.y+h&&(p.x<e.x||p.x>=e.x+w)&&(y<e.y||y>=e.y+h))count++;
      }
      return count;
    }
    escapeSpace(view,x,y,threats) {
      // Count visible clear follow-up steps, excluding the tile being fled.
      // This is room to maneuver, not a prediction of the enemy's next attack.
      return directions.filter(([,dx,dy])=>{
        const nx=x+dx,ny=y+dy;
        if(nx===view.player.x&&ny===view.player.y)return false;
        const tile=view.room.tiles.find(t=>t.x===nx&&t.y===ny);
        return tile?.solid===false&&!tile.isDoor&&!tile.exit&&!threats.has(key(nx,ny))&&
          !view.room.entities.some(e=>occupies(e,nx,ny)&&(e.collidable||e.isEnemy||e.appearance==='unidentified'));
      }).length;
    }
    route(view, threats) {
      const p=view.player,scope=view.room.id??'room';
      let map=this.maps.get(scope);
      if(!map){map=new Map();this.maps.set(scope,map);}
      // Remember only observations. Darkness does not erase earlier knowledge.
      for(const tile of view.room.tiles) {
        if(tile.solid!==null&&tile.solid!==undefined)map.set(key(tile.x,tile.y),{...tile});
      }
      const origin=key(p.x,p.y),seen=new Set();
      const queue=[{x:p.x,y:p.y,distance:0,first:null}];
      let remembered=this.obstacles.get(scope);
      if(!remembered){remembered=new Map();this.obstacles.set(scope,remembered);}
      const visibleTiles=new Set(view.room.tiles.filter(t=>t.solid!==null&&t.solid!==undefined).map(t=>key(t.x,t.y)));
      const currentIds=new Map(view.room.entities.filter(e=>e.id).map(e=>[e.id,e]));
      for(const [id,e] of remembered) {
        const current=currentIds.get(id);
        if((visibleTiles.has(key(e.x,e.y))&&!current)||current?.isEnemy||current?.collidable===false)remembered.delete(id);
      }
      for(const e of view.room.entities)if(e.id&&e.isEnemy===false&&e.collidable)remembered.set(e.id,{...e});
      const knownEntities=[...remembered.values()].filter(e=>!currentIds.has(e.id)).concat(view.room.entities);
      const occupants=new Map();
      for(const e of knownEntities)for(let x=e.x;x<e.x+Math.max(1,e.width??1);x++)
        for(let y=e.y;y<e.y+Math.max(1,e.height??1);y++)occupants.set(key(x,y),[...(occupants.get(key(x,y))??[]),e]);
      const items=new Set(view.room.items?.map(i=>key(i.x,i.y))??[]);
      const damage=view.inventory.find(i=>i?.activeWeapon)?.traits?.baseDamage??0;
      if(this.goal?.scope!==scope||this.goal?.key===origin)this.goal=null;
      let best=null,committed=null;
      const passages=[],returnExits=[];
      // Weighted shortest paths account for observed breakable obstacles.
      while(queue.length) {
        queue.sort((a,b)=>a.distance-b.distance);
        const node=queue.shift(),k=key(node.x,node.y),tile=map.get(k);
        if(seen.has(k))continue;
        seen.add(k);
        if(node.first) {
          const visits=this.visits.get(`${scope}:${k}`)??0;
          const uses=this.doorUses.get(`${scope}:${k}`)??0;
          let reward=visits===0?20:0;
          if(directions.some(([,dx,dy])=>!map.has(key(node.x+dx,node.y+dy))))reward=Math.max(reward,18);
          if(items.has(k)&&visits<3)reward=Math.max(reward,45);
          // Crossing lands beyond the door, so its tile never gains ordinary visits.
          // Passage use must replace the unvisited/frontier reward, not compete with it.
          if(tile?.isDoor)reward=35-40*uses;
          const returnExit=tile?.exit&&tile.traversal?.direction==='up';
          if(tile?.exit)reward=returnExit?0:70-40*uses;
          const utility=reward-visits;
          const score=utility-node.distance*2;
          const candidate={score,key:k,action:{type:'Move',direction:node.first}};
          if(tile?.isDoor||tile?.exit)passages.push(candidate);
          if(returnExit&&uses===0)returnExits.push(candidate);
          if(this.goal?.key===k&&!this.goal.backtrack)committed=candidate;
          if(utility>0&&(!best||score>best.score))best=candidate;
          // A door is a destination, not a known corridor into an unseen room.
          if(tile?.isDoor||tile?.exit)continue;
        }
        for(const [direction,dx,dy] of directions) {
          const x=node.x+dx,y=node.y+dy,next=key(x,y),t=map.get(next);
          if(seen.has(next)||!t||(t.solid&&!t.isDoor)||threats.has(next))continue;
          if(t.traversal?.tunnel && !t.traversal.unlocked && t.traversal.unlockFromHere===false)continue;
          if(t.exit&&t.traversal?.direction==='up'&&t.traversal.unlocked===false)continue;
          const occupied=occupants.get(next)??[];
          if(occupied.some(e=>e.appearance==='unidentified'||e.isEnemy||
            (e.collidable&&(!e.destroyable||damage<=0||!(e.health>0)))))continue;
          // Estimate effort, then replan from the actual outcome of each attack.
          const clearance=occupied.reduce((cost,e)=>cost+(e.collidable?Math.ceil(e.health/damage):0),0);
          const edge=`${scope}:${k}>${next}`;
          if((this.blocked.get(edge)??0)>this.tick)continue;
          queue.push({x,y,distance:node.distance+1+clearance,first:node.first??direction});
        }
      }
      const passageDetails=[...map.entries()].filter(([,t])=>t.isDoor||t.exit).map(([k,t])=>({
        key:k,exit:!!t.exit,uses:this.doorUses.get(`${scope}:${k}`)??0,
        reachable:seen.has(k),traversal:t.traversal??null,
        destination:this.connections.get(scope)?.get(k)??null,
        blockers:(occupants.get(k)??[]).map(e=>({id:e.id??null,collidable:e.collidable,
          destroyable:e.destroyable,pushable:e.pushable,health:e.health}))
      }));
      this.navigation={room:scope,knownTiles:map.size,reachableTiles:seen.size,
        localGoal:!!(committed??best),passageCount:passageDetails.length,
        passages:passageDetails.slice(0,32),
        rememberedWork:[...this.roomWork].filter(([,work])=>work).map(([room])=>room).slice(0,32)};
      this.roomWork.set(scope,!!(committed??best));
      // Revisit known passages only to reach a room with remembered unfinished work.
      const selected=committed??best??this.backtrack(scope,passages.sort((a,b)=>b.score-a.score))??
        returnExits.sort((a,b)=>b.score-a.score)[0];
      this.goal=selected?{scope,key:selected.key,...(selected.backtrack?{backtrack:true,targetRoom:selected.targetRoom}:{})}:null;
      return selected?.action??null;
    }
    inspect() {return {goal:this.goal?{...this.goal}:null,reason:this.reason,navigation:this.navigation??null};}
    choose(view) {
      this.reason='interaction';
      if(view.observationMode!=='player-perception') throw new Error('Baseline requires restricted perception');
      if(view.decision==='dismissable-interaction')return {type:'DismissInteraction'};
      if(view.decision==='ladder') return {type:'LadderConfirm'};
      if(view.decision==='selection') {
        const cancel=view.selectionChoices?.find(o=>o.enabled&&o.label==='Cancel');
        return cancel?{type:'SelectOption',index:cancel.index}:null;
      }
      if(view.decision!=='world') return null;
      const p=view.player, scope=view.room.id??'room';
      const here=`${scope}:${key(p.x,p.y)}`;
      this.visits.set(here,(this.visits.get(here)??0)+1);this.tick++;
      // Healing metadata is supplied by the item; no item/species name vocabulary.
      if(p.health<p.maxHealth) {
        const food=view.inventory.find(i=>i?.healingAmount>0&&!i.canUseOnOther&&i.useTurnCost===0);
        if(food) {this.reason='heal';return {type:'UseItem',slotIndex:food.slot};}
      }
      const tiles=new Map(view.room.tiles.map(t=>[key(t.x,t.y),t]));
      const threats=new Set(view.room.hitWarnings.filter(w=>w.hostile).map(w=>key(w.x,w.y)));
      const enemies=view.room.entities.filter(e=>e.appearance==='unidentified'||e.isEnemy);
      const route=this.route(view,threats);
      const adjacentEnemy=enemies.some(e=>directions.some(([,dx,dy])=>occupies(e,p.x+dx,p.y+dy)));
      // Attacking a blocking object can leave us on the current warning tile.
      const routeDirection=route&&directions.find(d=>d[0]===route.direction);
      const routeOccupant=routeDirection&&view.room.entities.find(e=>occupies(e,p.x+routeDirection[1],p.y+routeDirection[2]));
      const routePush=routeDirection&&this.canPushIntoSpace(view,p.x+routeDirection[1],p.y+routeDirection[2],routeDirection[1],routeDirection[2]);
      const staysForRoute=(routeOccupant?.collidable||routeOccupant?.destroyable)&&!routePush;
      if(route&&!adjacentEnemy&&!(staysForRoute&&threats.has(key(p.x,p.y)))) {
        this.reason=this.goal?.backtrack?'backtrack':'route';return route;
      }
      let best=null;
      for(const [direction,dx,dy] of directions) {
        const x=p.x+dx,y=p.y+dy,k=key(x,y),edge=`${here}>${k}`;
        const tile=tiles.get(k);
        if(tile?.solid===true && !tile.isDoor) continue;
        if(tile?.traversal?.tunnel && !tile.traversal.unlocked && tile.traversal.unlockFromHere===false)continue;
        if((this.blocked.get(edge)??0)>this.tick) continue;
        const occupant=view.room.entities.find(e=>occupies(e,x,y));
        if(occupant?.collidable && !occupant.destroyable && !occupant.pushable && !occupant.interactable) continue;
        const enemy=enemies.some(e=>occupies(e,x,y));
        const visits=this.visits.get(`${scope}:${k}`)??0;
        let score=10-3*visits-12*(this.crossings.get(edge)??0);
        const pushConfirmed=occupant?.pushable&&this.canPushIntoSpace(view,x,y,dx,dy);
        const stays=enemy||((occupant?.collidable||occupant?.destroyable)&&!pushConfirmed);
        const destination=stays?key(p.x,p.y):k;
        const weapon=view.inventory.find(i=>i?.activeWeapon)?.traits;
        const threshold=occupant?.combat?.killDamageThreshold;
        const killsSource=!!(enemy&&occupant?.id&&occupant.destroyable&&!occupant.pushable&&
          weapon?.attackPattern==='adjacent-cardinal'&&Number.isFinite(threshold)&&threshold>0&&
          Number.isFinite(weapon.minimumAttackDamage)&&weapon.minimumAttackDamage>=threshold);
        const remainingThreat=view.room.hitWarnings.some(w=>w.hostile&&(key(w.x,w.y)===destination||(occupant?.pushable&&key(w.x,w.y)===k))&&
          !(killsSource&&w.sourceId===occupant.id));
        const risk=remainingThreat?2:(!stays&&tile?.solid!==false&&!tile?.isDoor?1:0);
        if(enemy) score+=25;
        if(tile?.exit) score+=35;
        if(tile?.isDoor) score+=10;
        if(tile?.solid===false) score+=2;
        if(!tile || tile.kind===null) score+=1;
        const escapeSpace=!stays&&threats.has(key(p.x,p.y))?this.escapeSpace(view,x,y,threats):null;
        const laneExit=escapeSpace!==null?this.leavesThreatLane(view,x,y):0;
        const compareEscape=risk===0&&best?.risk===0&&escapeSpace!==null&&best.escapeSpace!==null;
        if(!best||risk<best.risk||(risk===best.risk&&
          (killsSource!==best.killsSource?!!killsSource:
          compareEscape&&escapeSpace!==best.escapeSpace?escapeSpace>best.escapeSpace:
            compareEscape&&laneExit!==best.laneExit?laneExit>best.laneExit:score>best.score)))best={risk,score,escapeSpace,laneExit,killsSource,action:{type:'Move',direction}};
      }
      this.reason=best?(threats.has(key(p.x,p.y))?'evade-warning':'local-combat-exploration'):'no-move';
      return best?.action??{type:'Wait'};
    }
    feedback(before,action,after,info) {
      if(action.type==='LadderConfirm'&&after.room.id!==before.room.id) {
        const scope=before.room.id??'room',k=key(before.player.x,before.player.y);
        if(before.room.tiles.some(t=>t.x===before.player.x&&t.y===before.player.y&&t.exit)) {
          this.connect(scope,k,after.room.id??'room');
          const destination=`${scope}:${k}`;
          this.doorUses.set(destination,(this.doorUses.get(destination)??0)+1);
        }
        this.goal=null;
      }
      if(action.type!=='Move')return;
      const direction=directions.find(d=>d[0]===action.direction),p=before.player;
      const edge=`${before.room.id??'room'}:${key(p.x,p.y)}>${key(p.x+direction[1],p.y+direction[2])}`;
      if(after.room.id!==before.room.id || Math.abs(after.player.x-p.x)+Math.abs(after.player.y-p.y)>1) {
        this.goal=null;
        this.crossings.set(edge,(this.crossings.get(edge)??0)+1);
        const destination=`${before.room.id??'room'}:${key(p.x+direction[1],p.y+direction[2])}`;
        this.doorUses.set(destination,(this.doorUses.get(destination)??0)+1);
        if(after.room.id!==before.room.id) {
          const from=before.room.id??'room',to=after.room.id??'room';
          const sourceDoor=before.room.tiles.find(t=>t.x===p.x+direction[1]&&t.y===p.y+direction[2]);
          if(sourceDoor?.isDoor||sourceDoor?.exit)this.connect(from,key(sourceDoor.x,sourceDoor.y),to);
          // Learn the reverse edge only by crossing it; nearby doors need not lead back.
        }
      }
      // A free hit is progress too. Only temporarily avoid unchanged failed directions.
      if(after.room.id===before.room.id&&after.player.x===p.x&&after.player.y===p.y&&info.turnDelta===0&&
        JSON.stringify(before.room.entities)===JSON.stringify(after.room.entities)&&
        JSON.stringify(before.room.hitWarnings)===JSON.stringify(after.room.hitWarnings)) {
        this.blocked.set(`${before.room.id??'room'}:${key(p.x,p.y)}>${key(p.x+direction[1],p.y+direction[2])}`,this.tick+12);
      }
    }
  }
  return {Policy};
});
