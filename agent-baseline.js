/* Programmed baseline: consumes only the restricted perception contract. */
(function(root, factory) {
  const api=factory(); api.source=factory.toString();
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.AgentBaseline=api;
})(typeof globalThis!=='undefined'?globalThis:this, function() {
  const directions=[['up',0,-1],['right',1,0],['down',0,1],['left',-1,0]];
  const key=(x,y)=>`${x},${y}`;
  class Policy {
    static version='explore-combat-v2';
    constructor(){this.visits=new Map();this.blocked=new Map();this.crossings=new Map();this.tick=0;}
    choose(view) {
      if(view.observationMode!=='player-perception') throw new Error('Baseline requires restricted perception');
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
      let best=null;
      for(const [direction,dx,dy] of directions) {
        const x=p.x+dx,y=p.y+dy,k=key(x,y),edge=`${here}>${k}`;
        const tile=tiles.get(k);
        if(tile?.solid===true && !tile.isDoor) continue;
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
        this.crossings.set(edge,(this.crossings.get(edge)??0)+1);
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
