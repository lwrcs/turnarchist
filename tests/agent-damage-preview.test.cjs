const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function members(file,names){const s=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);const c=s.statements.find(n=>ts.isClassDeclaration(n)&&n.members.some(m=>m.name?.getText(s)===names[0]));return c.members.filter(m=>names.includes(m.name?.getText(s))).map(m=>m.getText(s)).join('\n');}
function compile(code){const context={exports:{}};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,context);return context.exports;}
const entityMembers=members('src/entity/entity.ts',['onHurt','hurt','standardHurt','standardOnHurt','standardKillDamageThreshold','getAgentKillDamageThreshold','kill','standardKill','uniqueKillBehavior','standardUniqueKill','agentKillBehaviorKnown']);
const enemyMembers=members('src/entity/enemy/enemy.ts',['onHurt','standardEnemyOnHurt','uniqueKillBehavior','standardEnemyKillBehavior','agentKillBehaviorKnown','getAgentKillDamageThreshold']);
const {Entity,Enemy}=compile(`export class Entity {${entityMembers}} export class Enemy extends Entity {${enemyMembers}}`);
test('standard damage threshold follows health and future custom damage handlers fail closed',()=>{
  for(const Kind of [Entity,Enemy]){
    const e=new Kind();e.health=2;assert.equal(e.getAgentKillDamageThreshold(),2);
    e.health=7;assert.equal(e.getAgentKillDamageThreshold(),7);
    e.hurt=()=>{};assert.equal(e.getAgentKillDamageThreshold(),null);
  }
  class FutureEnemy extends Enemy {onHurt=()=>{this.health=10;};}
  const e=new FutureEnemy();e.health=1;assert.equal(e.getAgentKillDamageThreshold(),null);
  class CustomDeathEnemy extends Enemy {uniqueKillBehavior=()=>{this.dead=false;};}
  const custom=new CustomDeathEnemy();custom.health=1;assert.equal(custom.getAgentKillDamageThreshold(),null);
  class RevivingEnemy extends Enemy {kill=()=>{this.dead=false;};}
  const revived=new RevivingEnemy();revived.health=1;assert.equal(revived.getAgentKillDamageThreshold(),null);
});
const weaponMembers=members('src/item/weapon/weapon.ts',['attack','standardAttack','usesStandardAttackPipeline','executeAttack','getEntitiesAt','shouldHitEntity','standardShouldHitEntity']);
const daggerMembers=members('src/item/weapon/dagger.ts',['weaponMove','standardDaggerMove','getAgentAttackTraits']);
const {Dagger}=compile(`class Weapon {_swingHitIds=null;${weaponMembers}} export class Dagger extends Weapon {${daggerMembers}}`);
test('dagger damage lower bound follows live stats and rejects changed attack pipelines',()=>{
  const d=new Dagger();d.wielder={damageBonus:1};d.damage=2;d.manaCost=0;
  assert.equal(d.getAgentAttackTraits().minimumDamage,3);
  d.damage=1;assert.equal(d.getAgentAttackTraits().minimumDamage,2);
  d.weaponMove=()=>true;assert.equal(d.getAgentAttackTraits(),null);
  const changed=new Dagger();changed.wielder={damageBonus:0};changed.damage=1;changed.manaCost=0;
  changed.executeAttack=()=>false;assert.equal(changed.getAgentAttackTraits(),null);
});

test('skull damage handlers advertise their threshold but future overrides do not',()=>{
  for(const name of ['skullEnemy','bigSkullEnemy','armoredSkullEnemy']) {
    const body=members(`src/entity/enemy/${name}.ts`,['hurt','standardSkullHurt','getAgentKillDamageThreshold']);
    const {Skull}=compile(`class Entity {${entityMembers}} class Enemy extends Entity {${enemyMembers}} export class Skull extends Enemy {${body}}`);
    const e=new Skull();e.health=1;assert.equal(e.getAgentKillDamageThreshold(),1);
    e.hurt=()=>{};assert.equal(e.getAgentKillDamageThreshold(),null);
  }
});

test('a directional attack kills before the room ticks and never also moves the player',()=>{
  const playerBody=members('src/player/player.ts',['tryMove']);
  const {Player,AttackDagger}=compile(`const LevelState={TRANSITIONING:1,TRANSITIONING_LADDER:2};
    class Weapon {_swingHitIds=null;${weaponMembers}}
    export class AttackDagger extends Weapon {${daggerMembers}}
    export class Player {${playerBody}}`);
  for(const enemyHealth of [1,2]) {
    const p=new Player(),weapon=new AttackDagger();
    const enemy={x:1,y:0,z:0,destroyable:true,collidable:true,pushable:false,health:enemyHealth,dead:false,
      pointIn:(x,y)=>x===1&&y===0,hurt(_p,damage){this.health-=damage;this.dead=this.health<=0;}};
    const room={entities:[enemy],catchUp(){},tick(){if(!enemy.dead)p.health-=1;}};
    Object.assign(p,{x:0,y:0,z:0,health:2,damageBonus:0,game:{room,levelState:0},getRoom:()=>room,
      inventory:{hasWeapon:()=>true,getWeapon:()=>weapon},setHitXY(){},move(){throw new Error('Attack moved the player');}});
    Object.assign(weapon,{game:p.game,wielder:p,damage:1,manaCost:0,status:{},
      checkForPushables:()=>false,shouldHitEntity:()=>true,statusEffect(){},applyHitDelay(){},hitSound(){},
      attackAnimation(){},shakeScreen(){},degrade(){}});
    assert.equal(p.tryMove(1,0),true);
    assert.equal(p.x,0);assert.equal(p.y,0);
    assert.equal(p.health,enemyHealth===1?2:1);
  }
});
