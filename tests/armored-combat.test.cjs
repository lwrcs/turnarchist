const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function members(file,names){const s=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);return s.statements.find(ts.isClassDeclaration).members.filter(m=>names.includes(m.name?.getText(s))).map(m=>m.getText(s)).join('\n');}
const Direction={DOWN:0,UP:1,RIGHT:2,LEFT:3};
const context={exports:{},Direction,GameplaySettings:{HIT_STUNS_ATTACK:false},Sound:{playParry(){}},ImageParticle:{spawnCluster(){}},SpikeTrap:class {}};
vm.runInNewContext(ts.transpileModule(`class Base {${members('src/entity/enemy/enemy.ts',['handleEnemyCase','shouldSkipAttack'])}}
export class Skeleton extends Base {${members('src/entity/enemy/armoredSkullEnemy.ts',['hurt','behavior','REGEN_TICKS'])}}`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);
function setup(direction=Direction.LEFT,seenPlayer=true){
 const e=new context.exports.Skeleton(),p={x:4,y:5,levelID:0,health:10,hurt(d){this.health-=d;}};
 const room={playerTicked:p,roomArray:Array.from({length:12},()=>Array.from({length:12},()=>({})))};
 Object.assign(e,{x:5,y:5,health:3,maxHealth:3,damage:1,direction,seenPlayer,targetPlayer:p,aggro:true,ticks:0,alertTicks:0,skipNextTurns:0,
 room,game:{players:{local:p},localPlayerID:'local',rooms:[room],offlinePlayers:{},shakeScreen(){}},
 healthBar:{hurt(){}},startHurting(){},createDamageNumber(){},playHitSound(){},hurtCallback(){},kill(){this.dead=true;},
 getEntityDisablePositions:()=>[],searchPathLocalizedCached:()=>[{pos:{x:p.x,y:p.y}}],facePlayer(){},
 tryMove(x,y){if(x!==p.x||y!==p.y){this.x=x;this.y=y;}},setDrawXY(){},makeHitWarnings(){},hit:()=>1,
 lookForPlayer(){this.seenPlayer=true;},nearestPlayer:()=>false});
 return {e,p};
}
test('armored skeleton retaliates after armor-breaking front hit in every facing',()=>{
 for(const [dir,dx,dy] of [[0,0,1],[1,0,-1],[2,1,0],[3,-1,0]]){
  const {e,p}=setup(dir);p.x=e.x+dx;p.y=e.y+dy;
  e.hurt(p,1);e.behavior();assert.equal(e.health,2);assert.equal(p.health,9);
 }
});
test('side hit requires a turn before retaliation; hit does not move either combatant',()=>{
 const {e,p}=setup(Direction.UP);e.hurt(p,1);e.behavior();
 assert.equal(p.health,10);assert.equal(e.direction,Direction.LEFT);assert.deepEqual([e.x,e.y,p.x,p.y],[5,5,4,5]);
 e.behavior();assert.equal(p.health,9);
});
test('sleep wake-up and optional hit-stun still prevent the attack',()=>{
 const {e,p}=setup(Direction.LEFT,false);e.hurt(p,1);e.behavior();assert.equal(p.health,10);e.behavior();assert.equal(p.health,9);
 context.GameplaySettings.HIT_STUNS_ATTACK=true;
 try{const {e,p}=setup();e.hurt(p,1);e.behavior();assert.equal(p.health,10);}finally{context.GameplaySettings.HIT_STUNS_ATTACK=false;}
});
test('headless skeleton cannot retaliate, can be finished, and otherwise recovers after five ticks',()=>{
 const {e,p}=setup();e.hurt(p,2);assert.equal(e.unconscious,true);
 for(let i=0;i<4;i++)e.behavior();assert.equal(e.health,1);assert.equal(p.health,10);
 e.behavior();assert.equal(e.health,2);assert.equal(e.unconscious,false);assert.equal(p.health,10);
 const other=setup();other.e.hurt(other.p,2);other.e.hurt(other.p,1);other.e.behavior();assert.equal(other.e.dead,true);assert.equal(other.p.health,10);
});
