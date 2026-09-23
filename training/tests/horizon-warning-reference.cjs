/* Behavior excerpt from upstream 7ab7de52, hitWarning.ts and agentTraits.ts.
 * Rendering-only methods are stubbed. When a checkout is available the tests load
 * its actual complete HitWarning/agentTraits sources instead (see test loader).
 */
'use strict';
class HitWarning {
  parent = null; alpha = 0; tickedForDeath = false; skipSave = false;
  constructor(game,x,y,eX,eY,isEnemy,dirOnly=false,parent=null) {
    this.game=game;this.x=x;this.y=y;this.dead=false;this.parent=parent;
    this.eX=eX;this.eY=eY;this.dirOnly=dirOnly;
    this.isEnemy=isEnemy!==undefined?isEnemy:true;
    this.removeOverlapping();
  }
  getSaveFields(){return {eX:this.eX,eY:this.eY,isEnemy:!!this.isEnemy,dirOnly:!!this.dirOnly};}
  tick=()=>{if(this.tickedForDeath)this.dead=true;this.tickedForDeath=true;};
  isActive=()=>!this.dead&&!this.tickedForDeath&&!this.parent?.dead&&!this.parent?.unconscious;
  getAgentLifecycle=()=>({phase:this.tickedForDeath?'fading-out':'fading-in',dangerous:this.isActive()});
  removeOverlapping=()=>{
    for(const entity of this.game.room.entities)if(entity.x===this.x&&entity.y===this.y&&entity.pushable===false){this.dead=true;break;}
    for(const door of this.game.room.doors)if(door.x===this.x&&door.y===this.y){this.dead=true;break;}
  };
}
const numberOrNull=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
const stringOrNull=value=>typeof value==='string'?value:null;
function observeWarnings(warnings){
 return warnings.filter(warning=>!warning.dead).map(warning=>{
  const fields=warning.getSaveFields();
  const lifecycle=warning.getAgentLifecycle?.()??(()=>{const dangerous=warning.isActive?.()??true;return {phase:dangerous?'fading-in':'fading-out',dangerous};})();
  return {x:warning.x,y:warning.y,z:numberOrNull(warning.parent?.z)??0,sourceId:stringOrNull(warning.parent?.globalId),
   sourceX:numberOrNull(fields.eX),sourceY:numberOrNull(fields.eY),hostile:fields.isEnemy,directionOnly:fields.dirOnly,
   phase:lifecycle.phase,dangerous:lifecycle.dangerous&&fields.isEnemy,resolvesInTurns:null};
 });
}
// Verbatim old save/restore projection: intentionally missing source and lifecycle.
function legacyCopy(game,warnings){
 const saved=warnings.filter(hw=>hw&&!hw.skipSave).map(hw=>{
  const {eX,eY,isEnemy,dirOnly}=hw.getSaveFields();
  return {x:hw.x,y:hw.y,dead:hw.dead,eX,eY,isEnemy,dirOnly};
 });
 return saved.map(hws=>{
  const hw=new HitWarning(game,hws.x,hws.y,hws.eX??hws.x,hws.eY??hws.y,hws.isEnemy,hws.dirOnly);
  hw.dead=hws.dead;return hw;
 });
}
module.exports={HitWarning,observeWarnings,legacyCopy};
