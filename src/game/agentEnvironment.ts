import { AgentScenario, isCombatScenario, combatEncounter } from "./combatTestbed";
import { DEFAULT_AGENT_VISION, validateAgentVision, perceiveRoom, AgentVision } from "./agentPerception";
import type { Game } from "../game";
import { Direction } from "../game";
import { AgentMemory } from "./agentMemory";
import { setAgentFastMode } from "./agentMode";
import { RoomType, TurnState } from "../room/room";
import { DownLadder } from "../tile/downLadder";
import { UpLadder } from "../tile/upLadder";
import { isActionReady } from "./actionReadiness";
import { GameConstants } from "./gameConstants";
import { GameplaySettings } from "./gameplaySettings";
import { getAgentContract, checkAgentCompatibility, AgentContract } from "./agentContract";
import { observeEntity, observeItem, observeWarnings } from "./agentTraits";
import type { GameAction } from "../player/playerAction";

export type AgentAction =
  | { type: "Move"; direction: "up" | "down" | "left" | "right" }
  | Extract<GameAction, {type: "UseItem" | "UseItemOn" | "MoveItem" | "DropItem"}>
  | { type: "SelectOption"; index: number }
  | { type: "DismissInteraction" }
  | { type: "VendingMachineBuy" }
  | { type: "LadderConfirm" }
  | { type: "LadderCancel" }
  | Extract<GameAction, {type:"FireRanged" | "CastSpell"}>;

const directions = {
  up: [Direction.UP, 0, -1], down: [Direction.DOWN, 0, 1],
  left: [Direction.LEFT, -1, 0], right: [Direction.RIGHT, 1, 0],
};

function operatorAStar(room: any,start:{x:number;y:number},target:{x:number;y:number},blocked:Set<string>) {
  const key=(x:number,y:number)=>`${x},${y}`,heuristic=(x:number,y:number)=>Math.abs(x-target.x)+Math.abs(y-target.y);
  const open=[{...start,g:0,f:heuristic(start.x,start.y)}],best=new Map([[key(start.x,start.y),0]]),parents=new Map<string,string>();
  while(open.length){
    open.sort((a,b)=>a.f-b.f||a.g-b.g);const current=open.shift()!,currentKey=key(current.x,current.y);
    if(current.x===target.x&&current.y===target.y){
      const path:{x:number;y:number}[]=[];let cursor=currentKey;
      while(cursor!==key(start.x,start.y)){const [x,y]=cursor.split(",").map(Number);path.push({x,y});cursor=parents.get(cursor)!;}
      return path.reverse();
    }
    for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
      const x=current.x+dx,y=current.y+dy,nextKey=key(x,y);
      if(!room.roomArray[x]?.[y]||blocked.has(nextKey))continue;
      const g=current.g+1;if(g>=(best.get(nextKey)??Infinity))continue;
      best.set(nextKey,g);parents.set(nextKey,currentKey);open.push({x,y,g,f:g+heuristic(x,y)});
    }
  }
  return [];
}

class AgentActionError extends Error {
  readonly code = "AGENT_ACTION_REJECTED";
}

interface TacticalFrame {
  roomId: string;
  player: { x: number; y: number; z: number; health: number; mana: number; turnCount: number };
  entities: ReturnType<typeof observeEntity>[];
  warnings: ReturnType<typeof observeWarnings>;
}

interface AgentTransition {
  step: number;
  action: AgentAction;
  recorded: boolean;
  before: TacticalFrame;
  after: TacticalFrame;
}

/** Browser-backed v1. Uses real gameplay; it is not yet a deterministic Node simulator. */
export class AgentEnvironment {
  private vision: AgentVision = {...DEFAULT_AGENT_VISION};
  private scenario: AgentScenario = "standard";
  private busy = false;
  private seed: number | null = null;
  private steps = 0;
  private maxSteps = 1000;
  private failure: string | null = null;
  private recentTransitions: AgentTransition[] = [];
  private contacts = new Map<string, {id:string; step:number; x:number; y:number; previous?:{step:number;x:number;y:number}}>();
  private contactKeys = new WeakMap<object,string>();
  private nextContactKey = 0;
  private memory = new AgentMemory();

  constructor(private game: Game, private timeoutMs = 15000) {}
  setFastMode(enabled: boolean) { setAgentFastMode(enabled === true); }
  getUiLayout() {
    const player=this.player();
    return {...player.inventory.getAgentUiLayout(),
      screenMessage:player.screenMessage.getAgentUiLayout(),
      vendingMachine:player.openVendingMachine?.getAgentUiLayout?.()??{open:false,box:null},
      selectionButtons:player.menu?.getAgentSelectionButtonRects?.()??[]};
  }
  getWorldClickAction(nx: number, ny: number): AgentAction | null {
    if(!Number.isFinite(nx)||!Number.isFinite(ny)||nx<0||nx>1||ny<0||ny>1)return null;
    const player=this.player(), inventory=player.inventory;
    if(inventory.isOpen||!["world","vending"].includes(this.observe().decision))return null;
    const width=GameConstants.WIDTH,height=GameConstants.HEIGHT,tileSize=GameConstants.TILESIZE;
    const dx=Math.floor((nx*width-width/2+tileSize/2)/tileSize);
    const dy=Math.floor((ny*height-height/2+tileSize/2)/tileSize);
    const targetX=player.x+dx,targetY=player.y+dy;
    const targeting=player.rangedTargeting;
    if(targeting?.active){
      const weapon=targeting.getWeapon?.() as unknown as {pendingSpell?:{id?:string};activeSpell?:{id?:string}},
        spell=weapon?.pendingSpell??weapon?.activeSpell;
      if(spell?.id)return {type:"CastSpell",spellId:spell.id,
        sourceSlot:inventory.items.indexOf(weapon as any),targetX,targetY};
      return {type:"FireRanged",targetX,targetY};
    }
    if(dx===0&&dy<0)return {type:"Move",direction:"up"};
    if(dx===0&&dy>0)return {type:"Move",direction:"down"};
    if(dy===0&&dx<0)return {type:"Move",direction:"left"};
    if(dy===0&&dx>0)return {type:"Move",direction:"right"};
    return null;
  }
  setInventoryOpen(open: boolean) {
    const inventory=this.player().inventory;
    if(open===inventory.isOpen)return;
    open?inventory.open():inventory.close();
  }

  private player() { return this.game.players[this.game.localPlayerID]; }

  contract() { return getAgentContract(); }
  checkCompatibility(trainedOn: Partial<AgentContract> | null) {
    return checkAgentCompatibility(trainedOn);
  }

  private tacticalFrame(): TacticalFrame {
    const player = this.player();
    const room = player.getRoom();
    return {
      roomId: room.globalId,
      player: {x: player.x, y: player.y, z: player.z, health: player.health,
        mana: player.mana, turnCount: player.turnCount},
      entities: room.entities.filter(entity => !entity.dead).map(observeEntity),
      warnings: observeWarnings(room.hitwarnings),
    };
  }

  private ready(): boolean {
    const player = this.player();
    return !!player && isActionReady(this.game) && !this.game.paused &&
      !player.busyAnimating && !this.game.cameraAnimation?.active &&
      !player.isPushMoveInputLocked?.() &&
      player.getRoom().turn === TurnState.playerTurn &&
      (player.dead || player.movement.canMove());
  }

  private async settle(): Promise<void> {
    const deadline = performance.now() + this.timeoutMs;
    while (!this.ready()) {
      if (performance.now() >= deadline) throw new Error("Agent step timed out; reload the agent tab before continuing");
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async exclusive<T>(operation: () => Promise<T>): Promise<T> {
    if (this.busy) throw new Error("Another agent operation is in progress");
    if (this.failure) throw new Error(this.failure);
    this.busy = true;
    try { return await operation(); }
    catch (error) {
      if (!(error instanceof AgentActionError)) this.failure = String(error);
      throw error;
    } finally { this.busy = false; }
  }

  async reset(seed: number, options: { maxSteps?: number; vision?: AgentVision; scenario?: AgentScenario } = {}) {
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
      throw new Error("Seed must be an unsigned 32-bit integer");
    }
    const scenario = options.scenario ?? "standard";
    if (!["standard", "forest", "cave"].includes(scenario) && !isCombatScenario(scenario)) throw new Error("Unsupported diagnostic scenario");
    const vision = validateAgentVision(options.vision ?? DEFAULT_AGENT_VISION);
    const maxSteps = options.maxSteps ?? 1000;
    if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 100000) {
      throw new Error("maxSteps must be an integer from 1 to 100000");
    }
    return this.exclusive(async () => {
      // Finish the previous world's callbacks before replacing it.
      await this.settle();
      this.game.replayManager.cancelReplay();
      this.game.newGame(seed);
      await this.settle();
      if (isCombatScenario(scenario)) this.game.startCombatSandbox(scenario, seed);
      else if (scenario !== "standard") this.game.startLightingSandbox(scenario, seed);
      this.scenario = scenario;
      this.game.started = true;
      this.game.startedFadeOut = true;
      this.game.startMenuActive = false;
      this.game.startMenu?.close();
      this.seed = seed;
      this.steps = 0;
      this.contacts.clear();
      this.memory.clear();
      this.contactKeys = new WeakMap();this.nextContactKey=0;
      this.recentTransitions = [];
      this.maxSteps = maxSteps;
      this.vision = vision;
      await this.settle();
      if (scenario !== "standard") {
        const player = this.player();
        if (player.screenMessage.open && player.getRoom().roomArray[player.x]?.[player.y] instanceof DownLadder) {
          player.actionProcessor.process({type: "LadderConfirm"});
          await this.settle();
        }
      }
      return { ...this.observe(), ready: true, canExtendBudget: true };
    });
  }

  /** Runner budget only: never advances simulation or discards an unfinished turn. */
  extendBudget(additionalSteps: number) {
    if (!Number.isSafeInteger(additionalSteps) || additionalSteps < 1 ||
      !Number.isSafeInteger(this.maxSteps + additionalSteps)) {
      throw new Error("additionalSteps must be a positive safe integer within the total budget range");
    }
    if (this.busy) throw new Error("Another agent operation is in progress");
    if (this.failure) throw new Error(this.failure);
    if (this.seed === null) throw new Error("Call reset(seed) first");
    if (this.player()?.dead) throw new Error("Episode ended; call reset(seed)");
    this.maxSteps += additionalSteps;
    return this.observe();
  }

  private budgetStatus() {
    const exhausted = this.steps >= this.maxSteps;
    return {
      truncationReason: this.failure ? "failure" : exhausted ? "action-budget" : null,
      canExtendBudget: this.seed !== null && !this.busy && !this.failure && !this.player()?.dead,
    };
  }

  /** Unknown costs stay unknown: a directional input may walk, attack, or interact. */
  describeAction(action: AgentAction) {
    const items = this.player().inventory.items;
    let turnCost: number | null = null;
    if (action.type === "MoveItem" || action.type === "DismissInteraction" || action.type === "VendingMachineBuy") turnCost = 0;
    if (action.type === "UseItem") turnCost = items[action.slotIndex]?.getUseTurnCost?.() ?? null;
    if (action.type === "UseItemOn") turnCost = items[action.fromSlot]?.getUseOnTurnCost?.(items[action.toSlot]) ?? null;
    if (action.type === "SelectOption") turnCost = this.player().menu?.getSelectionChoices()?.[action.index]?.turnCost ?? null;
    return {turnCost, basis: turnCost === null ? "depends-on-resolution" : "gameplay-rule"};
  }

  private operatorDescription(value: unknown): string | null {
    try {
      const text=(value as {examineText?:()=>unknown})?.examineText?.();
      return typeof text==="string"&&text.trim()?text.trim():null;
    } catch { return null; }
  }

  /**
   * Privileged, read-only current-room view for collecting demonstrations from a
   * reasoning model. This is deliberately separate from perceive(), which is the
   * observation stored with every training action.
   */
  inspectOperator() {
    const observation=this.observe(),player=this.player(),room=player.getRoom();
    const entities=room.entities.filter(e=>!e.dead).map(e=>({
      ...observeEntity(e),description:this.operatorDescription(e),
      footprint:{x:e.x,y:e.y,width:e.w||1,height:e.h||1},
    }));
    const items=room.items.filter(i=>!i.pickedUp).map(i=>({
      ...observeItem(i),description:this.operatorDescription(i),z:i.z,
    }));
    const hazards=(room.projectiles??[]).filter(p=>!p.dead).flatMap(p=>{
      const traits=(p as unknown as {getAgentHazardTraits?:()=>{kind:string;damage:number;solid:boolean}}).getAgentHazardTraits?.();
      return traits?[{id:(p as any).globalId??null,x:p.x,y:p.y,z:p.z??0,...traits}]:[];
    });
    const warnings=observeWarnings(room.hitwarnings);
    const enemyCount=entities.filter(e=>e.isEnemy).length;
    const warningDamage=(x:number,y:number)=>{
      const active=warnings.filter(w=>w.hostile&&w.dangerous&&w.x===x&&w.y===y);
      const unique=active.filter((warning,index)=>!warning.sourceId||
        active.findIndex(candidate=>candidate.sourceId===warning.sourceId)===index);
      const values=unique.map(w=>{const source=entities.find(e=>e.id===w.sourceId);return source?.combat.currentDamage??source?.combat.baseDamage??null;});
      const known=values.filter((v):v is number=>v!==null);
      return {knownDamage:known.reduce((n,v)=>n+v,0),unknownDamageSources:values.length-known.length,
        sources:unique.map(w=>w.sourceId)};
    };
    const projectileDamage=(x:number,y:number)=>hazards.filter(h=>h.x===x&&h.y===y&&h.damage>0)
      .reduce((n,h)=>n+h.damage,0);
    const weapon=observation.inventory.find(i=>i?.activeWeapon)??null;
    const moves=Object.entries(directions).map(([direction,value])=>{
      const [,dx,dy]=value,x=player.x+dx,y=player.y+dy;
      const tile=room.roomArray[x]?.[y];
      const occupant=entities.find(e=>x>=e.footprint.x&&x<e.footprint.x+e.footprint.width&&
        y>=e.footprint.y&&y<e.footprint.y+e.footprint.height);
      const attack=occupant?.isEnemy===true||occupant?.destroyable===true&&occupant?.pushable!==true;
      const threshold=occupant?.combat.killDamageThreshold??null;
      const damage=weapon?.traits.minimumAttackDamage??null;
      const kills=attack&&threshold!==null&&damage!==null?damage>=threshold:null;
      let pushOutcome:null|"player-moves"|"head-object-destroyed"|"unknown"=null;
      if(occupant?.pushable){
        if(occupant.footprint.width!==1||occupant.footprint.height!==1)pushOutcome="unknown";
        else {const behindX=x+dx,behindY=y+dy,behindTile=room.roomArray[behindX]?.[behindY];
          const behindEntity=entities.find(e=>e.id!==occupant.id&&e.z===player.z&&behindX>=e.footprint.x&&
            behindX<e.footprint.x+e.footprint.width&&behindY>=e.footprint.y&&behindY<e.footprint.y+e.footprint.height);
          pushOutcome=!behindTile?"unknown":behindEntity?.chainPushable===false||behindTile.canCrushEnemy?.()===true?
            "head-object-destroyed":"player-moves";}
      }
      const staysInPlace=pushOutcome?pushOutcome!=="player-moves":attack||occupant?.collidable===true||tile?.isSolid()===true;
      const landing=staysInPlace?{x:player.x,y:player.y}:{x,y};
      const threats=warningDamage(landing.x,landing.y),projectiles=projectileDamage(landing.x,landing.y);
      const neutralized=kills&&occupant?.id?warnings.filter(w=>w.sourceId===occupant.id&&w.dangerous).length:0;
      const sourceDamage=occupant?.combat.currentDamage??occupant?.combat.baseDamage??0;
      const knownDamage=Math.max(0,threats.knownDamage-(neutralized?sourceDamage:0))+projectiles;
      return {direction,target:{x,y},resolution:occupant?.pushable?"push-or-attack":attack?"attack":
        tile?.isDoor?"door-transition-or-door-interaction":tile instanceof DownLadder||tile instanceof UpLadder?"ladder":
        tile?.isSolid()?"blocked-or-interact":"move",staysInPlace,pushOutcome,occupantId:occupant?.id??null,
        attack:{attempted:attack,minimumDamage:damage,killThreshold:threshold,killsBeforeEnemyResponse:kills,
          neutralizesThreatSource:kills&&neutralized>0},
        consequence:{landing,knownIncomingDamageBeforeDefense:knownDamage,unknownDamageSources:threats.unknownDamageSources,
          currentStateBasis:true,defenseAdjusted:false,projectileDamage:projectiles,warningSources:threats.sources},
        hint:knownDamage>0||threats.unknownDamageSources>0?
          `This action currently leaves the player on a threatened tile: ${knownDamage} known incoming damage before equipped defenses${threats.unknownDamageSources?` plus ${threats.unknownDamageSources} unknown source(s)`:""}.`:
          kills&&neutralized?"This hit is known to kill its target before the enemy response and neutralize that source's active warning.":null};
    });
    const currentThreat=warningDamage(player.x,player.y),currentProjectile=projectileDamage(player.x,player.y);
    const tiles=observation.room.tiles.map(t=>{const tile=room.roomArray[t.x]?.[t.y];return {...t,
      solid:tile?.isSolid?.()??null,isDoor:tile?.isDoor??false,
      exit:tile instanceof DownLadder||tile instanceof UpLadder,
      traversal:(tile as any)?.getTraversalTraits?.()??null,
      hazard:(tile as any)?.getAgentHazardTraits?.()??null,
      description:this.operatorDescription(tile)};});
    const pointsOfInterest=[
      ...tiles.filter(t=>t.isDoor||t.exit).map(t=>({id:`tile:${t.x},${t.y}`,kind:t.isDoor?"door":"ladder",x:t.x,y:t.y,
        route:this.operatorPathTo(t.x,t.y,{allowOccupiedTarget:true})})),
      ...items.map(item=>({id:item.id,kind:"item",x:item.x,y:item.y,
        route:item.x!==null&&item.y!==null?this.operatorPathTo(item.x,item.y):null})),
    ];
    return {
      schemaVersion:1,observationMode:"privileged-demonstration-operator",privileged:true,
      purpose:"chat-model-demonstration-collection",trainingPolicyObservation:false,
      limitations:["current room only","no future rooms","no RNG or seed outcomes","read-only; actions still use recorded teaching controls"],
      player:observation.player,inventory:observation.inventory,decision:observation.decision,
      selectionChoices:observation.selectionChoices,vendingMachine:observation.vendingMachine,
      room:{id:room.globalId,depth:room.depth,pathId:room.pathId,roomType:room.type,
        environment:room.level?.environment?.type??null,x:room.roomX,y:room.roomY,width:room.width,height:room.height,
        bossRoom:room.type===RoomType.BOSS,enemyCount,enemyFree:enemyCount===0,
        progressBlockedByEnemies:room.type===RoomType.BOSS&&enemyCount>0,
        progressRule:room.type===RoomType.BOSS?"Kill every enemy in this boss room before progression unlocks.":null,
        sidePath:room.pathId!=="main",sidePathHint:room.pathId!=="main"?
          "This is an optional side path. Search it for food and other resources, then return to the main path.":null,
        tiles,entities,items,warnings,hazards},
      tactical:{currentTile:{...currentThreat,knownIncomingDamageBeforeDefense:currentThreat.knownDamage+currentProjectile,
        defenseAdjusted:false,projectileDamage:currentProjectile},moves,
        instruction:currentThreat.sources.length?
          "If an active warning is under the player, either leave it or kill its source before the enemy response. A verified lethal hit neutralizes only that source.":null},
      pathfinding:{algorithm:"A*",query:"teachingOperatorPath(targetX,targetY,options)",
        pointsOfInterest,
        batching:enemyCount===0&&!warnings.some(w=>w.dangerous)&&hazards.every(h=>h.damage<=0)?
          "Room is enemy-free with no active damage markers. A returned path may be queued, stopping before any door, ladder, interaction, failed action, health change, or room change.":
          "Do not batch while enemies or active damage markers are present."},
      inspection:{query:"teachingInspectObject(id)",ids:[...entities,...items,...observation.inventory.filter(Boolean)]
        .map(v=>v!.id).filter(Boolean)},
    };
  }

  /** Read-only A* over the complete current room. The target remains explicit. */
  operatorPathTo(targetX:number,targetY:number,options:{avoidThreats?:boolean;allowOccupiedTarget?:boolean}={}) {
    if(!Number.isInteger(targetX)||!Number.isInteger(targetY))throw new Error("Path target must use integer tile coordinates");
    const player=this.player(),room=player.getRoom();
    if(!room.roomArray[targetX]?.[targetY])throw new Error("Path target is outside the current room");
    const blocked=new Set<string>();
    for(let x=room.roomX;x<room.roomX+room.width;x++)for(let y=room.roomY;y<room.roomY+room.height;y++)
      if(room.roomArray[x]?.[y]?.isSolid?.())blocked.add(`${x},${y}`);
    for(const entity of room.entities.filter(e=>!e.dead&&e.collidable))for(let x=entity.x;x<entity.x+(entity.w||1);x++)
      for(let y=entity.y;y<entity.y+(entity.h||1);y++)blocked.add(`${x},${y}`);
    if(options.avoidThreats!==false){
      for(const warning of observeWarnings(room.hitwarnings))if(warning.hostile&&warning.dangerous)blocked.add(`${warning.x},${warning.y}`);
      for(const hazard of room.projectiles??[]){const t=(hazard as any).getAgentHazardTraits?.();if(!hazard.dead&&t?.damage>0)blocked.add(`${hazard.x},${hazard.y}`);}
    }
    blocked.delete(`${player.x},${player.y}`);
    if(options.allowOccupiedTarget)blocked.delete(`${targetX},${targetY}`);
    const nodes=operatorAStar(room,{x:player.x,y:player.y},{x:targetX,y:targetY},blocked);
    let previous={x:player.x,y:player.y};
    const steps=nodes.map(node=>{const step={...node,direction:
      node.x>previous.x?"right":node.x<previous.x?"left":node.y>previous.y?"down":"up"};previous=node;return step;});
    return {algorithm:"A*",from:{x:player.x,y:player.y},target:{x:targetX,y:targetY},
      avoidThreats:options.avoidThreats!==false,reachable:targetX===player.x&&targetY===player.y||steps.length>0,
      steps,actions:steps.map(s=>({type:"Move",direction:s.direction}))};
  }

  inspectOperatorObject(id:string) {
    if(typeof id!=="string"||!id)throw new Error("Object id is required");
    const room=this.player().getRoom();
    const entity=room.entities.find(e=>!e.dead&&e.globalId===id);
    if(entity)return {objectType:"entity",...observeEntity(entity),description:this.operatorDescription(entity),
      mechanics:{footprint:{x:entity.x,y:entity.y,width:entity.w||1,height:entity.h||1},
        pushable:entity.pushable,chainPushable:entity.chainPushable,collidable:entity.collidable}};
    const item=room.items.find(i=>!i.pickedUp&&i.globalId===id);
    if(item)return {objectType:"item",...observeItem(item),description:this.operatorDescription(item)};
    const slot=this.player().inventory.items.findIndex(i=>i?.globalId===id);
    if(slot>=0){const inventoryItem=this.player().inventory.items[slot];return {objectType:"inventory-item",slot,
      ...observeItem(inventoryItem),description:this.operatorDescription(inventoryItem),
      equipped:(inventoryItem as any).equipped===true,activeWeapon:inventoryItem===this.player().inventory.weapon};}
    throw new Error("Object is not present in the current room");
  }

  /** Restricted current perception. Never includes diagnostic history or unseen room contents. */
  perceive(vision: AgentVision = this.vision) {
    vision = validateAgentVision(vision);
    if (this.busy) throw new Error("Wait for the current operation before perceiving");
    const observation = this.observe();
    const room = this.player().getRoom();
    const project = (visibleRoom: typeof room) => {
      const room=visibleRoom;
      const tiles=[];
      for(let x=room.roomX;x<room.roomX+room.width;x++)for(let y=room.roomY;y<room.roomY+room.height;y++){
        const tile=room.getGameplayLightTile(x,y);
        if(tile)tiles.push({x,y,kind:tile.constructor.name,solid:tile.isSolid(),isDoor:tile.isDoor,
          traversal:(tile as unknown as {getTraversalTraits?:()=>object}).getTraversalTraits?.(),
          hazard:(tile as unknown as {getAgentHazardTraits?:()=>object}).getAgentHazardTraits?.(),
          exit:tile instanceof DownLadder||tile instanceof UpLadder});
      }
      const perceived = this.memory.remember(room.globalId, perceiveRoom({
      player: observation.player, tiles,
      entities: room.entities.filter(e=>!e.dead).map(e=>{
        const traits=observeEntity(e);
        if(!traits.id){let key=this.contactKeys.get(e);if(!key){key=`unregistered-${++this.nextContactKey}`;this.contactKeys.set(e,key);}traits.id=key;}
        return traits;
      }),
      items: room.items.filter(item => !item.pickedUp).map(item => ({...observeItem(item), z: item.z})),
      warnings: observeWarnings(room.hitwarnings),
      hazards: (room.projectiles??[]).filter(p=>!p.dead).flatMap(p=>{
        const traits=(p as unknown as {getAgentHazardTraits?:()=>{kind:string;damage:number;solid:boolean}}).getAgentHazardTraits?.();
        return traits?[{x:p.x,y:p.y,z:p.z??0,...traits}]:[];
      }),
      brightness: (x, y) => {
        const darkness = room.vis[x]?.[y];
        return typeof darkness === "number" && Number.isFinite(darkness)
          ? Math.max(0, Math.min(1, 1-darkness)) : 0;
      },
      blocked: (x, y) => room.isGameplaySightBlocked(x, y),
    }, vision));
      const localIds=new Map<string,string>();
      const entities=perceived.entities.map(e=>{
        const key=e.id;
        if(!key)return e;
        let contact=this.contacts.get(key);
        if(!contact){contact={id:`c${this.contacts.size+1}`,step:this.steps,x:e.x,y:e.y};this.contacts.set(key,contact);}
        else if(contact.step!==this.steps){contact.previous={step:contact.step,x:contact.x,y:contact.y};contact.step=this.steps;contact.x=e.x;contact.y=e.y;}
        localIds.set(key,contact.id);
        return {...e,id:contact.id,tracking:contact.previous?{
          dx:e.x-contact.previous.x,dy:e.y-contact.previous.y,stepsSinceSeen:this.steps-contact.previous.step}:null};
      });
      const connections=(room.doors??[]).filter(d=>d.linkedDoor?.room?.entered &&
        perceived.tiles.some(t=>t.x===d.x&&t.y===d.y&&t.isDoor)).map(d=>({
          from:{roomId:room.globalId,x:d.x,y:d.y},
          to:{roomId:d.linkedDoor.room.globalId,...d.linkedDoor.getArrivalPosition(d.linkedDoor.room.roomX-room.roomX>0?1:-1)},
          linkedDoor:{x:d.linkedDoor.x,y:d.linkedDoor.y},
        }));
      return {id:room.globalId,context:{depth:room.depth,roomType:room.type,environment:room.level?.environment?.type??null},...perceived,entities,connections,hitWarnings:[...perceived.hitWarnings.map(w=>{
        const {sourceId,...rest}=w;
        return sourceId&&localIds.has(sourceId)?{...rest,sourceId:localIds.get(sourceId)}:rest;
      }),...perceived.hazards.filter(h=>h.damage>0).map(h=>({x:h.x,y:h.y,z:h.z,hostile:true,directionOnly:false}))]};
    };
    const perceived=project(room);
    const visibleRooms=(this.game.rooms??[]).filter(r=>r!==room && r.entered &&
      r.pathId===room.pathId && r.roomX<=observation.player.x+vision.range && r.roomX+r.width>observation.player.x-vision.range &&
      r.roomY<=observation.player.y+Math.ceil(vision.range*.75) && r.roomY+r.height>observation.player.y-Math.ceil(vision.range*.75))
      .map(project);
    return {
      schemaVersion: 10, observationMode: "player-perception", vision: {...vision,halfWidth:vision.range,halfHeight:Math.ceil(vision.range*.75)},
      contract: {...this.contract(), observationSchemaVersion: 10, observationMode: "player-perception"},
      ready: observation.ready, terminated: observation.terminated, truncated: observation.truncated,
      player: observation.player, inventory: observation.inventory,
      ui: {inventoryOpen:this.player().inventory.isOpen},
      decision: observation.decision, selectionChoices: observation.selectionChoices,
      vendingMachine: observation.vendingMachine,
      room: perceived, visibleRooms,
    };
  }

  /** Explicit lab measurement, not a policy observation or step. */
  inspectLighting(iterations = 20) {
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > 50) throw new Error("iterations must be 1..50");
    if (this.busy || !this.ready() || this.seed === null) throw new Error("Wait for a ready initialized run");
    const room = this.player().getRoom();
    const samples: number[] = [];
    for (let i = 0; i < iterations + 3; i++) {
      const start = performance.now();
      room.updateLighting();
      const elapsed = performance.now() - start;
      if (i >= 3) samples.push(elapsed);
    }
    samples.sort((a,b) => a-b);
    const start = performance.now();
    const perception = this.perceive();
    const perceptionMs = performance.now()-start;
    const observation = this.observe();
    const tiles = observation.room.tiles.map(tile => ({...tile,
      color: [...(room.col[tile.x]?.[tile.y] ?? [0,0,0])],
      brightness: 1-(room.vis[tile.x]?.[tile.y] ?? 1),
      blocked: room.isGameplaySightBlocked(tile.x,tile.y),
    }));
    return {
      source: "lighting-diagnostic", scenario: this.scenario, seed: this.seed,
      buildId: this.contract().buildId,
      room: {width: room.width, height: room.height, sources: room.lightSources.length,
        entities: room.entities.length, tiles},
      milliseconds: {iterations, median: samples[Math.floor(samples.length/2)],
        p95: samples[Math.ceil(samples.length*.95)-1], max: samples[samples.length-1], perception: perceptionMs},
      player: observation.player, perception,
      thresholdSweep: [0.04, 0.08, 0.16].map(identificationBrightness => {
        const view = this.perceive({...this.vision, identificationBrightness});
        return {identificationBrightness,
          identified: view.room.entities.filter(e => e.appearance === "identified").length,
          anonymous: view.room.entities.filter(e => e.appearance === "unidentified").length,
          warnings: view.room.hitWarnings.length};
      }),
    };
  }

  observe() {
    const player = this.player();
    if (!player) throw new Error("Game is still initializing");
    const room = player.getRoom();
    const tiles: { x: number; y: number; kind: string }[] = [];
    for (let x = room.roomX; x < room.roomX + room.width; x++) {
      for (let y = room.roomY; y < room.roomY + room.height; y++) {
        const tile = room.roomArray[x]?.[y];
        if (tile) tiles.push({ x, y, kind: tile.constructor.name });
      }
    }
    const ladderChoice = player.screenMessage.open &&
      room.roomArray[player.x]?.[player.y] instanceof DownLadder;
    const vendingMachine=player.openVendingMachine?.open?{
      item:player.openVendingMachine.item?observeItem(player.openVendingMachine.item):null,
      costs:(player.openVendingMachine.costItems??[]).map(observeItem),
      quantity:player.openVendingMachine.isInf?null:player.openVendingMachine.quantity,
      infinite:player.openVendingMachine.isInf,
      canAfford:(player.openVendingMachine.costItems??[]).every(item=>player.inventory.hasItemCount(item)),
      purchaseTurnCost:0,
    }:null;
    return {
      schemaVersion: 10, contract: this.contract(),
      backend: "browser", observationMode: "diagnostic-current-room",
      seed: this.seed, scenario: this.scenario,
      encounter: isCombatScenario(this.scenario) ? combatEncounter(this.scenario) : null, steps: this.steps, maxSteps: this.maxSteps,
      ...this.budgetStatus(),
      initialized: this.seed !== null,
      ready: this.seed !== null && !this.busy && !player.dead &&
        this.steps < this.maxSteps && !this.failure && this.ready(),
      terminated: player.dead, truncated: this.steps >= this.maxSteps || this.failure !== null,
      failure: this.failure, developerMode: GameConstants.DEVELOPER_MODE,
      player: { x: player.x, y: player.y, z: player.z, health: player.health,
        maxHealth: player.maxHealth, mana: player.mana, maxMana: player.maxMana,
        turnCount: player.turnCount,
        coins: typeof player.inventory.coinCount === "function"
          ? player.inventory.coinCount() : Number.isFinite(player.inventory.coins)
            ? player.inventory.coins : null },
      room: { id: room.globalId, depth: room.depth, x: room.roomX, y: room.roomY,
        width: room.width, height: room.height, tiles,
        entities: room.entities.filter(entity => !entity.dead).map(observeEntity),
        items: room.items.filter(item => !item.pickedUp).map(observeItem),
        hitWarnings: observeWarnings(room.hitwarnings),
      },
      inventory: player.inventory.items.map((item, slot) => item ? {
        ...observeItem(item), slot,
        equipped: (item as unknown as {equipped?: boolean}).equipped === true,
        activeWeapon: item === player.inventory.weapon,
      } : null),
      selectionChoices: player.menu?.getSelectionChoices() ?? null,
      vendingMachine,
      // Bounded history supports temporal policies; it is not online model learning.
      recentTransitions: JSON.parse(JSON.stringify(this.recentTransitions)) as AgentTransition[],
      decision: player.screenMessage.open ? (ladderChoice ? "ladder" : "dismissable-interaction") :
        player.openVendingMachine?.open ? "vending" : player.contextMenu?.open ? "dismissable-interaction" :
        player.menu?.open ? (player.menu.getSelectionChoices() ? "selection" : "unsupported-modal") : "world",
    };
  }

  async step(input: AgentAction) {
    // Validate the external action before taking ownership of the episode.
    if (!input || typeof input !== "object" ||
      !["Move", "DismissInteraction", "VendingMachineBuy", "LadderConfirm", "LadderCancel", "UseItem", "UseItemOn", "MoveItem", "DropItem", "SelectOption", "FireRanged", "CastSpell"].includes(input.type) ||
      ("slotIndex" in input && (!Number.isInteger(input.slotIndex) || input.slotIndex < 0)) ||
      ((input.type === "UseItem" || input.type === "DropItem") && !("slotIndex" in input)) ||
      ((input.type === "UseItemOn" || input.type === "MoveItem") &&
        (!Number.isInteger(input.fromSlot) || !Number.isInteger(input.toSlot) || input.fromSlot < 0 || input.toSlot < 0)) ||
      (input.type === "SelectOption" && (!Number.isInteger(input.index) || input.index < 0)) ||
      ((input.type === "FireRanged" || input.type === "CastSpell") &&
        (!Number.isInteger(input.targetX)||!Number.isInteger(input.targetY)||Math.abs(input.targetX)>1000000||Math.abs(input.targetY)>1000000)) ||
      (input.type === "CastSpell" && (typeof input.spellId!=="string"||!input.spellId||
        (input.sourceSlot!==undefined&&(!Number.isInteger(input.sourceSlot)||input.sourceSlot<0)))) ||
      (input.type === "Move" && !Object.prototype.hasOwnProperty.call(directions, input.direction))) {
      throw new Error("Unsupported agent action");
    }
    const actionInput = { ...input };
    if (this.seed === null) throw new Error("Call reset(seed) first");
    if (this.player()?.dead) throw new Error("Episode ended; call reset(seed)");
    if (this.steps >= this.maxSteps) throw new Error("Action budget exhausted; call extendBudget(additionalSteps) to continue this run");
    return this.exclusive(async () => {
      await this.settle();
      const before = this.observe();
      const beforeFrame = this.tacticalFrame();
      const ladderAction = actionInput.type === "LadderConfirm" || actionInput.type === "LadderCancel";
      const vendingAction=before.decision==="vending"&&
        ["VendingMachineBuy","DismissInteraction","Move"].includes(actionInput.type);
      const dismissAction=before.decision==="dismissable-interaction"&&
        actionInput.type==="DismissInteraction";
      if (before.decision === "unsupported-modal" ||
        (before.decision === "ladder") !== ladderAction ||
        (before.decision === "selection") !== (actionInput.type === "SelectOption") ||
        (before.decision === "dismissable-interaction") !== dismissAction ||
        (before.decision === "vending") !== vendingAction) {
        throw new AgentActionError(`Cannot use ${actionInput.type} for current decision: ${before.decision}; choose the current interaction`);
      }
      const player = this.player();
      const items = player.inventory.items;
      if(actionInput.type==="CastSpell"&&actionInput.sourceSlot!==undefined&&!items[actionInput.sourceSlot])
        throw new AgentActionError("Spell source slot is empty or out of bounds");
      if ("slotIndex" in actionInput && !items[actionInput.slotIndex]) {
        throw new AgentActionError("Inventory slot is empty or out of bounds");
      }
      if ("fromSlot" in actionInput && (!items[actionInput.fromSlot] || actionInput.toSlot >= items.length ||
        (actionInput.type === "UseItemOn" && (!items[actionInput.toSlot] ||
          !(items[actionInput.fromSlot] as unknown as {canUseOnOther?: boolean}).canUseOnOther)))) {
        throw new AgentActionError("Invalid inventory source or target");
      }
      if (actionInput.type === "UseItem" && (items[actionInput.slotIndex] as unknown as {canUseOnOther?: boolean}).canUseOnOther) {
        throw new AgentActionError("This item needs a target; use UseItemOn");
      }
      let action: GameAction | null = null;
      if (actionInput.type === "Move") {
        const [direction, dx, dy] = directions[actionInput.direction];
        action = { type: "Directional", direction, targetX: player.x + dx, targetY: player.y + dy };
      } else if (actionInput.type !== "SelectOption") action = actionInput;
      const prediction = this.describeAction(actionInput);
      const count = this.game.replayManager.getStats().count;
      if (actionInput.type === "SelectOption") {
        if (!player.menu.selectChoice(actionInput.index)) throw new AgentActionError("Selection is disabled or unavailable");
      } else player.actionProcessor.process(action!);
      this.steps++;
      await this.settle();
      const recorded = this.game.replayManager.getStats().count > count;
      this.recentTransitions.push({ step: this.steps, action: actionInput, recorded,
        before: beforeFrame, after: this.tacticalFrame() });
      if (this.recentTransitions.length > 8) this.recentTransitions.shift();
      const observation = this.observe();
      return { observation: { ...observation, canExtendBudget: !observation.terminated && !this.failure, ready: !observation.terminated && !observation.truncated },
        terminated: observation.terminated, truncated: observation.truncated,
        info: { recorded, encounterCleared: this.encounterCleared(), predictedTurnCost: prediction.turnCost,
          turnDelta: observation.player.turnCount - before.player.turnCount } };
    });
  }

  private encounterCleared(): boolean {
    if (!isCombatScenario(this.scenario) || this.player()?.dead) return false;
    const room = this.player().getRoom();
    // Pending projectiles include enemy spawn animations and delayed attacks.
    return !room.entities.some(e=>e.isEnemy&&!e.dead) &&
      !(room.projectiles ?? []).some(p=>!p.dead);
  }

  exportReplay() {
    if (this.busy) throw new Error("Wait for the current operation before exporting");
    return JSON.parse(JSON.stringify({ schemaVersion: 2, contract: this.contract(), source: "agent-browser",
      gameVersion: GameConstants.VERSION, observationMode: "diagnostic-current-room",
      developerMode: GameConstants.DEVELOPER_MODE, seed: this.seed, scenario: this.scenario,
      encounter: isCombatScenario(this.scenario) ? combatEncounter(this.scenario) : null,
      diagnosticSandbox: this.scenario !== "standard", encounterCleared: this.encounterCleared(),
      settings: { ...GameplaySettings },
      vision: {...this.vision},
      timing: { animationSpeed: GameConstants.ANIMATION_SPEED,
        slowInputsNearEnemies: GameConstants.SLOW_INPUTS_NEAR_ENEMIES },
      steps: this.steps, maxSteps: this.maxSteps, terminated: this.player()?.dead ?? false,
      truncated: this.steps >= this.maxSteps || this.failure !== null,
      ...this.budgetStatus(),
      failure: this.failure, recentTransitions: this.recentTransitions,
      replay: this.game.replayManager.serialize() }));
  }
}
