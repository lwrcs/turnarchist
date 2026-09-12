import { AgentScenario, isCombatScenario, combatEncounter } from "./combatTestbed";
import { DEFAULT_AGENT_VISION, validateAgentVision, perceiveRoom, AgentVision } from "./agentPerception";
import type { Game } from "../game";
import { Direction } from "../game";
import { AgentMemory } from "./agentMemory";
import { setAgentFastMode } from "./agentMode";
import { TurnState } from "../room/room";
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
