/* Programmed baseline: consumes only the restricted perception contract. */
(function(root, factory) {
  const api=factory(); api.source=factory.toString();
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.AgentBaseline=api;
})(typeof globalThis!=='undefined'?globalThis:this, function() {
  const directions=[['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]];
  const key=(x,y)=>`${x},${y}`;
  class Policy {
    static version='explore-combat-v8';
    constructor(){this.visits=new Map();this.blocked=new Map();this.crossings=new Map();this.tick=0;this.maps=new Map();this.doorUses=new Map();this.goal=null;}
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
      const occupants=new Map(view.room.entities.map(e=>[key(e.x,e.y),e]));
      const items=new Set(view.room.items?.map(i=>key(i.x,i.y))??[]);
      const damage=view.inventory.find(i=>i?.activeWeapon)?.traits?.baseDamage??0;
      if(this.goal?.scope!==scope||this.goal?.key===origin)this.goal=null;
      let best=null,committed=null;
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
          if(tile?.exit)reward=70-40*uses;
          const score=reward-node.distance*2-visits;
          const candidate={score,key:k,action:{type:'Move',direction:node.first}};
          if(this.goal?.key===k)committed=candidate;
          if(score>0&&(!best||score>best.score))best=candidate;
          // A door is a destination, not a known corridor into an unseen room.
          if(tile?.isDoor||tile?.exit)continue;
        }
        for(const [direction,dx,dy] of directions) {
          const x=node.x+dx,y=node.y+dy,next=key(x,y),t=map.get(next);
          if(seen.has(next)||!t||(t.solid&&!t.isDoor)||threats.has(next))continue;
          if(t.traversal?.tunnel && !t.traversal.unlocked && t.traversal.unlockFromHere===false)continue;
          const occupant=occupants.get(next);
          let clearance=0;
          if(occupant&&(occupant.appearance==='unidentified'||occupant.isEnemy))continue;
          if(occupant?.collidable) {
            if(!occupant.destroyable||damage<=0||!(occupant.health>0))continue;
            // Estimate effort, then replan from the actual outcome of each attack.
            clearance=Math.ceil(occupant.health/damage);
          }
          const edge=`${scope}:${k}>${next}`;
          if((this.blocked.get(edge)??0)>this.tick)continue;
          queue.push({x,y,distance:node.distance+1+clearance,first:node.first??direction});
        }
      }
      const selected=committed??best;
      this.goal=selected?{scope,key:selected.key}:null;
      return selected?.action??null;
    }
    choose(view) {
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
        if(food) return {type:'UseItem',slotIndex:food.slot};
      }
      const tiles=new Map(view.room.tiles.map(t=>[key(t.x,t.y),t]));
      const threats=new Set(view.room.hitWarnings.filter(w=>w.hostile).map(w=>key(w.x,w.y)));
      const enemies=view.room.entities.filter(e=>e.appearance==='unidentified'||e.isEnemy);
      const route=this.route(view,threats);
      const adjacentEnemy=enemies.some(e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y)===1);
      if(route&&!adjacentEnemy)return route;
      let best=null;
      for(const [direction,dx,dy] of directions) {
        const x=p.x+dx,y=p.y+dy,k=key(x,y),edge=`${here}>${k}`;
        const tile=tiles.get(k);
        if(tile?.solid===true && !tile.isDoor) continue;
        if(tile?.traversal?.tunnel && !tile.traversal.unlocked && tile.traversal.unlockFromHere===false)continue;
        if((this.blocked.get(edge)??0)>this.tick) continue;
        const occupant=view.room.entities.find(e=>e.x===x&&e.y===y);
        if(occupant?.collidable && !occupant.destroyable && !occupant.pushable && !occupant.interactable) continue;
        const enemy=enemies.some(e=>e.x===x&&e.y===y);
        const visits=this.visits.get(`${scope}:${k}`)??0;
        let score=10-3*visits-12*(this.crossings.get(edge)??0);
        if(threats.has(k)) score-=100;
        if(enemy) score+=25;
        if(tile?.exit) score+=35;
        if(tile?.isDoor) score+=10;
        if(tile?.solid===false) score+=2;
        if(!tile || tile.kind===null) score+=1;
        if(!best||score>best.score)best={score,action:{type:'Move',direction}};
      }
      return best?.action??{type:'Wait'};
    }
    feedback(before,action,after,info) {
      if(action.type!=='Move')return;
      const direction=directions.find(d=>d[0]===action.direction),p=before.player;
      const edge=`${before.room.id??'room'}:${key(p.x,p.y)}>${key(p.x+direction[1],p.y+direction[2])}`;
      if(after.room.id!==before.room.id || Math.abs(after.player.x-p.x)+Math.abs(after.player.y-p.y)>1) {
        this.goal=null;
        this.crossings.set(edge,(this.crossings.get(edge)??0)+1);
        const destination=`${before.room.id??'room'}:${key(p.x+direction[1],p.y+direction[2])}`;
        this.doorUses.set(destination,(this.doorUses.get(destination)??0)+1);
      }
      // A free hit is progress too. Only temporarily avoid unchanged failed directions.
      if(after.player.x===p.x&&after.player.y===p.y&&info.turnDelta===0&&
        JSON.stringify(before.room.entities)===JSON.stringify(after.room.entities)&&
        JSON.stringify(before.room.hitWarnings)===JSON.stringify(after.room.hitWarnings)) {
        this.blocked.set(`${before.room.id??'room'}:${key(p.x,p.y)}>${key(p.x+direction[1],p.y+direction[2])}`,this.tick+12);
      }
    }
  }
  return {Policy};
});
