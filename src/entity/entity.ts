import { Direction, Game } from "../game";
import { Room } from "../room/room";
import { Player } from "../player/player";
import { HealthBar } from "../drawable/healthbar";
import { Drawable } from "../drawable/drawable";
import { Item } from "../item/item";
import { GameConstants } from "../game/gameConstants";
import { HitWarning } from "../drawable/hitWarning";
import { Projectile } from "../projectile/projectile";
import { Utils } from "../utility/utils";
import type { LightSource } from "../lighting/lightSource";
import { DamageNumber } from "../particle/damageNumber";
import { DownLadder } from "../tile/downLadder";
import { Door } from "../tile/door";
import { Wall } from "../tile/wall";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { Shadow } from "../drawable/shadow";

import { DropTable } from "../item/dropTable";
import { Weapon } from "../item/weapon/weapon";
import { EnemyShield } from "../projectile/enemyShield";
import { Sound } from "../sound/sound";
import { ImageParticle } from "../particle/imageParticle";
import { Coin } from "../item/coin";
import { Random } from "../utility/random";
import { XPPopup } from "../particle/xpPopup";
import { Tile } from "../tile/tile";
import { BeamEffect } from "../projectile/beamEffect";
import { Lighting } from "../lighting/lighting";
import { Enemy } from "./enemy/enemy";
import { ENTITY_EXAMINE_TEXT } from "../examine/entityExamineText";
import type { Skill } from "../game/skills";
import { computeEnemyKillBaseXp } from "../game/skillBalance";

export enum EntityDirection {
  DOWN,
  UP,
  RIGHT,
  LEFT,
}

export enum EntityType {
  ENEMY,
  FRIENDLY,
  RESOURCE,
  PROP,
  CHEST,
}

export interface entityData {
  name: string;
  location: { x: number; y: number; z?: number };
}

export interface bloomData {
  blurAmount: number;
  color: string;
  xOffset: number;
  yOffset: number;
  size: number;
  alpha: number;
}

export class Entity extends Drawable {
  globalId: string;
  room: Room;
  x: number;
  y: number;
  /**
   * Vertical layer within a room/level. Rendering will be handled later.
   * Most game logic should only interact with other objects on the same `z`.
   */
  z: number;
  w: number;
  h: number;
  direction: Direction;
  drawX: number;
  drawY: number;
  dead: boolean;
  game: Game;
  health: number;
  maxHealth: number;
  defaultMaxHealth: number;
  protected tileX: number;
  protected tileY: number;
  protected hasShadow: boolean;
  skipNextTurns: number;
  //TODO: change these to functions? for enemies that switch states
  destroyable: boolean; // can the player destroy this enemy?
  destroyableByOthers: boolean; // can other entities destroy this enemy?
  pushable: boolean; // can the player push this enemy? (true for crates/barrels, false for regular mobs)
  chainPushable: boolean; // can the player pushing another enemy push this enemy? (default true)
  interactable: boolean; // can the player interact
  protected deathParticleColor: string;
  healthBar: HealthBar;
  drop: Item;
  protected sleepingZFrame = 0;
  alertTicks: number;
  protected exclamationFrame: number;
  lastX: number;
  lastY: number;
  protected hitBy: Player | null;
  protected lastHitWeapon: Weapon | null;
  protected lastHitCombatSkill: Skill;
  protected lastHitKillXpMultiplier: number;
  protected crushX: number;
  protected crushY: number;
  protected crushVertical: boolean;
  // Used to ease-in the crush squish animation (slow → fast), similar to push easing.
  protected crushAnimStartScale: number;
  protected crushed: boolean;
  /**
   * Direction of the force that caused the crush.
   * - (1,0) means pushed right into a crush tile
   * - (-1,0) means pushed left
   * - (0,1) means pushed down
   * - (0,-1) means pushed up
   *
   * Used only for rendering offsets (so crushed death clones don't disappear inside walls).
   */
  protected crushPushDX: number;
  protected crushPushDY: number;
  // Crush animation decay factor per ~60fps tick (higher = slower squish).
  // Applied as `pow(factor, delta)` so it's stable across frame rates.
  protected static readonly CRUSH_DECAY_60FPS = 0.985;
  rumbling: boolean;
  protected animationSpeed: number;
  drawYOffset: number;
  name: string;
  protected orthogonalAttack: boolean;
  protected diagonalAttack: boolean;
  protected forwardOnlyAttack: boolean;
  protected attackRange: number;
  protected diagonalAttackRange: number;
  /**
   * Controls how aggressively `makeHitWarnings()` culls warning tiles based on the
   * player's relative position. 0 = no culling (show full pattern).
   *
   * Default (0.45) matches the existing behavior.
   */
  hitWarningCullFactor: number = 0.45;
  lightSource: LightSource;
  drawMoveSpeed: number;
  unconscious: boolean;
  hitWarnings: HitWarning[];
  imageParticleX: number = 0;
  imageParticleY: number = 26;
  dropChance: number = 1;
  isEnemy: boolean;
  shielded: boolean;
  buffed: boolean;
  buffedBefore: boolean;
  //shieldHealth: number;
  frame: number;
  shield: EnemyShield;
  shieldedBefore: boolean;
  //shadeColor: string;
  shadeMultiplier: number = 1;
  hurting: boolean;
  hurtFrame: number;

  /**
   * Context-menu "Examine" text. Empty string = no examine option.
   * Prefer adding a `static examineText = "..."` to specific Entity subclasses.
   */
  examineText = (): string => {
    const ctorName = (this.constructor as { name?: unknown }).name;
    if (typeof ctorName === "string") {
      const s = ENTITY_EXAMINE_TEXT[ctorName];
      if (typeof s === "string" && s.trim().length > 0) return s.trim();
    }
    const ctor = this.constructor as unknown as { examineText?: unknown };
    if (typeof ctor.examineText === "string") {
      const s = ctor.examineText.trim();
      if (s.length > 0) return s;
    }
    return "";
  };
  softShadeColor: string;
  shadeColor: string;
  dying: boolean;
  dyingFrame: number;
  alpha: number;
  cloned: boolean;
  hasBloom: boolean;
  bloomColor: string = "#FFFFFF";
  bloomAlpha: number = 1;
  softBloomAlpha: number = 1;
  bloomSize: number = 1;
  bloomOffsetY: number = 0;
  target: { x: number; y: number };
  moving: boolean;
  dropTable: string[];
  drops: Item[];
  opaque: boolean = false;
  opacity: number = 0;
  hasHitParticles: boolean = true;
  hasDamageNumbers: boolean = true;
  armored: boolean = false;
  justHurt: boolean = false;
  stunned: boolean = false;
  collidable: boolean = true;
  canDestroyOthers: boolean = false;
  canCrushOthers: boolean = false;
  beamIds: string[] = [];
  extendShadow: boolean = false;
  shadowOpacity: number = 0.3;
  lootDropped: boolean = false;
  seeThroughAlpha: number = 1;
  softSeeThroughAlpha: number = 1;
  // Shadow rendering resources moved to Shadow class

  private _imageParticleTiles: { x: number; y: number };
  hitSound: () => void;

  constructor(room: Room, game: Game, x: number, y: number, z: number = 0) {
    super();
    this.globalId = IdGenerator.generate("EN");

    // Check if we're in cloning mode (constructor flag used by cloneEntity)
    const ctor = this.constructor as unknown as { __isCloning?: boolean };
    const isCloning = ctor.__isCloning === true;

    // Set cloned status immediately if we're cloning
    if (isCloning) {
      this.cloned = true;
    } else this.cloned = false;

    // Only set the absolute minimum required properties if cloning
    this.room = room;
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = 1;
    this.h = 1;
    this.game = game;
    this.drawX = 0;
    this.drawY = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 0;
    this.tileY = 0;
    this.hasShadow = true;
    this.skipNextTurns = 0;
    this.direction = Direction.DOWN;
    this.destroyable = true;
    this.destroyableByOthers = true;
    this.pushable = false;
    this.chainPushable = true;
    this.interactable = false;
    this.healthBar = new HealthBar();
    this.alertTicks = 0;
    this.exclamationFrame = 0;
    this.lastX = x;
    this.lastY = y;
    this.hitBy = null;
    this.lastHitWeapon = null;
    this.lastHitCombatSkill = "melee";
    this.lastHitKillXpMultiplier = 1;
    this.crushX = 1;
    this.crushY = 1;
    this.crushVertical = false;
    this.crushAnimStartScale = 1;
    this.crushed = false;
    this.crushPushDX = 0;
    this.crushPushDY = 0;
    this.rumbling = false;
    this.animationSpeed = 0.1;
    this.drawYOffset = 1.175;
    this.hitWarnings = [];
    this.orthogonalAttack = false;
    this.diagonalAttack = false;
    this.forwardOnlyAttack = false;
    this.attackRange = 1;
    this.diagonalAttackRange = 1;
    this.drawMoveSpeed = 0.9;
    this.unconscious = false;
    this.dropChance = 0.02;
    this.isEnemy = false;
    this.shielded = false;
    this.shield = null;
    this.frame = 0;
    this.shieldedBefore = false;
    this._imageParticleTiles = { x: 0, y: 0 };
    this.hitSound = null;
    this.shadeColor = this.room.shadeColor;
    this.hurting = false;
    this.hurtFrame = 0;
    this.softShadeColor = "#000000";
    this.dying = false;
    this.dyingFrame = 30;
    this.alpha = 1;
    this.dead = false;
    this.hasBloom = false;
    this.bloomColor = "#FFFFFF";
    this.moving = false;
    this.dropTable = [];
    this.drops = [];
    this.canDestroyOthers = false;
    this.canCrushOthers = false;
    this.beamIds = [];
    this.extendShadow = false;
    if (this.drop) this.drops.push(this.drop);
  }

  /**
   * Returns true if this entity occupies the given tile coordinate, accounting for footprint.
   * Useful for interactions involving 2x2+ enemies where `x/y` alone is insufficient.
   */
  occupiesTile = (tx: number, ty: number, tz?: number): boolean => {
    if (typeof tz === "number" && (this.z ?? 0) !== tz) return false;
    const w = this.w ?? 1;
    const h = this.h ?? 1;
    return tx >= this.x && tx < this.x + w && ty >= this.y && ty < this.y + h;
  };

  /**
   * Returns the nearest tile coordinate on this entity's footprint to the given point.
   * This prevents "diagonal" misclassification when large enemies hit from their far edge.
   */
  closestTileToPoint = (px: number, py: number): { x: number; y: number } => {
    const w = this.w ?? 1;
    const h = this.h ?? 1;
    const x = Math.max(this.x, Math.min(px, this.x + w - 1));
    const y = Math.max(this.y, Math.min(py, this.y + h - 1));
    return { x, y };
  };

  static add<
    T extends new (
      room: Room,
      game: Game,
      x: number,
      y: number,
      ...rest: unknown[]
    ) => Entity,
  >(this: T, room: Room, game: Game, x: number, y: number, ...rest: unknown[]) {
    // Safety checks: verify tile exists and is not solid
    if (!room.roomArray[x] || !room.roomArray[x][y]) {
      console.warn(`Cannot add entity: tile at (${x}, ${y}) does not exist`);
      return null;
    }

    if (room.roomArray[x][y].isSolid()) {
      console.warn(`Cannot add entity: tile at (${x}, ${y}) is solid`);
      return null;
    }

    const entity = new this(room, game, x, y, ...rest);
    room.entities.push(entity);
    return entity;
  }

  static cloneEntity(original: Entity): Entity {
    // Set a temporary flag on the constructor to indicate we're cloning
    (original.constructor as any).__isCloning = true;

    // Create minimal clone
    const cloned = new (original.constructor as typeof Entity)(
      original.room,
      original.game,
      original.x,
      original.y,
      original.z ?? 0,
    );

    // Remove the temporary flag
    delete (original.constructor as any).__isCloning;

    // Copy only properties needed for death animation
    Object.assign(cloned, {
      cloned: true,
      dead: false,
      dying: true,
      drawableY: original.drawableY,
      tileX: original.tileX,
      tileY: original.tileY,
      frame: original.frame,
      direction: original.direction,
      drawX: original.drawX,
      drawY: original.drawY,
      z: original.z ?? 0,
      alpha: original.alpha,
      shadeColor: original.shadeColor,
      shadeMultiplier: original.shadeMultiplier,
      softShadeColor: original.softShadeColor,
      hasBloom: original.hasBloom,
      bloomColor: original.bloomColor,
      // Preserve current bloom intensity, but target a fade-out.
      // This fixes death-clone bloom "sticking" at full brightness.
      bloomAlpha: 0,
      softBloomAlpha: original.softBloomAlpha,
      bloomSize: original.bloomSize,
      bloomOffsetY: original.bloomOffsetY,
      dyingFrame: 30,
      // Preserve "pushed" easing state so if an entity is pushed and dies from damage
      // (not crush), the death animation still uses the push easing profile.
      pushAnimActive: original.pushAnimActive,
      pushAnimStartMag: original.pushAnimStartMag,
      // Preserve crush state so the death clone can animate squishing when crushed into walls.
      crushed: original.crushed,
      crushX: original.crushX,
      crushY: original.crushY,
      crushVertical: original.crushVertical,
      crushPushDX: original.crushPushDX,
      crushPushDY: original.crushPushDY,
      crushAnimStartScale: original.crushAnimStartScale,
    });

    // Add to room's dead entities
    original.room.deadEntities.push(cloned);

    return cloned;
  }

  /**
   * Clones the current entity without adding it to deadEntities.
   */
  clone(): Entity {
    const cloned = Entity.cloneEntity(this);
    cloned.dead = false; // Explicitly set as not dead
    cloned.dying = true; // Ensure the clone is in a dying state

    return cloned;
  }

  hoverText = (): string => {
    return this.name;
  };

  get imageParticleTiles() {
    return this._imageParticleTiles;
  }

  outlineColor = (): string => {
    let color = "black";
    if (this.shielded) color = GameConstants.OUTLINE_SHIELD_COLOR;
    if (this.buffed) color = GameConstants.OUTLINE_BUFF_COLOR;
    if (this.shielded && this.buffed) color = "#5a87ff";
    return color;
  };

  outlineOpacity = (): number => {
    let opacity = 0;
    if (this.shielded) opacity = 0.25;
    if (this.buffed) opacity = 0.25;
    if (this.shielded && this.buffed) opacity = 0.5;
    return opacity;
  };

  applyShield = (shieldHealth: number = 1, loading: boolean = false) => {
    if (!this.shieldedBefore || loading) {
      this.shield = new EnemyShield(this, this.x, this.y, shieldHealth);
      this.shielded = true;
      this.shieldedBefore = true;
      if (!loading) {
        this.health += shieldHealth;
        this.maxHealth = this.defaultMaxHealth + shieldHealth;
      }

      this.shadeColor = "purple";
      this.shadeMultiplier = 0.5;
      this.hasBloom = true;
      this.bloomColor = "#2E0854";
      this.bloomAlpha = 1;
    }
  };

  removeShield = () => {
    if (this.shield) {
      this.health -= this.shield.health;
      this.maxHealth -= this.shield.health;
      this.shield.remove();
      this.shadeColor = this.room.shadeColor;
      this.shadeMultiplier = 1;
      this.hasBloom = false;
      this.bloomAlpha = 0;
    }
  };

  applyBuff = () => {
    this.buffed = true;
    this.buffedBefore = true;
    this.shadeColor = "cyan";
    this.shadeMultiplier = 0.5;
    this.hasBloom = true;
    this.bloomColor = "#00FFFF";
    this.bloomAlpha = 0.5;
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [0, 40, 40],
      3.5,
      20,
    );
    this.addLightSource(this.lightSource);
    this.room.updateLighting();
  };

  removeBuff = () => {
    let beams = this.room.projectiles.filter(
      (projectile) =>
        projectile instanceof BeamEffect && projectile.parent === this,
    );
    if (beams) {
      beams.forEach((beam) => {
        beam.dead = true;
      });
    }
    //this.shadeColor = "black";
    //this.lightSource = null;
    //this.shield = null;
    this.shadeColor = this.room.shadeColor;
    this.shadeMultiplier = 1;
    this.hasBloom = false;
    this.bloomAlpha = 0;
    this.removeLightSource(this.lightSource);
    this.lightSource = null;
    this.room.updateLighting();
    this.buffed = false;
  };

  getDrop = (useCategory: string[] = [], force: boolean = false) => {
    if (this.cloned) return;
    const drops =
      this.dropTable && this.dropTable.length > 0
        ? this.dropTable
        : useCategory;
    DropTable.getDrop(this, drops, force, 3);
    //make monsters drop degraded weapons
    if (this.drop instanceof Weapon && this.type === EntityType.ENEMY) {
      this.drop.durability = Math.floor(
        Random.rand() * 0.31 * this.drop.durabilityMax,
      );
      this.drop.durabilityMax;
    }
  };

  addLightSource = (lightSource: LightSource) => {
    if (!this.cloned) this.room.lightSources.push(lightSource);
  };

  removeLightSource = (lightSource: LightSource) => {
    this.room.lightSources = this.room.lightSources.filter(
      (ls) => ls !== lightSource,
    );
    //this.lightSource = null;
    this.room.updateLighting();
  };

  addBeamId = (beamId: string) => {
    this.beamIds.push(beamId);
  };

  removeBeamId = (beamId: string) => {
    this.beamIds = this.beamIds.filter((id) => id !== beamId);
  };

  behavior = () => {};

  hit = (): number => {
    return 0;
  };

  hurtCallback = () => {};

  get type() {
    return EntityType.ENEMY;
  }

  pointIn = (x: number, y: number): boolean => {
    return (
      x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
    );
  };

  /**
   * UI helper: draw an entity sprite given its base mob tilesheet coordinates.
   * Useful for bestiary pages without instantiating enemies.
   */
  static drawIdleSprite = (args: {
    tileX: number;
    tileY: number;
    x: number;
    y: number;
    frames?: number;
    frameStride?: number;
    frameMs?: number;
    w?: number;
    h?: number;
    drawW?: number;
    drawH?: number;
    shadeColor?: string;
    shadeAmount?: number;
  }) => {
    const frames = args.frames ?? 1;
    const stride = args.frameStride ?? 1;
    const frameMs = args.frameMs ?? 220;
    const w = args.w ?? 1;
    const h = args.h ?? 1;
    const drawW = args.drawW ?? w;
    const drawH = args.drawH ?? h;
    const shadeColor = args.shadeColor ?? "Black";
    const shadeAmount = args.shadeAmount ?? 0;

    const frameIndex =
      frames <= 1 ? 0 : Math.floor(Date.now() / frameMs) % frames;
    // Frames on the tilesheet are laid out horizontally; for multi-tile sprites,
    // each frame consumes `w` tiles of width.
    const tx = args.tileX + frameIndex * stride * w;

    Game.drawMob(
      tx,
      args.tileY,
      w,
      h,
      args.x,
      args.y,
      drawW,
      drawH,
      shadeColor,
      shadeAmount,
    );
  };

  createDamageNumber = (
    damage: number,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    let color = "red";
    let outlineColor = GameConstants.OUTLINE;
    if (type === "poison") color = "green";
    if (type === "blood") {
      color = "#8B0000";
      outlineColor = "red";
    }
    if (type === "heal") {
      color = "#B8A4FF";
      outlineColor = GameConstants.OUTLINE;
    }
    this.room.particles.push(
      new DamageNumber(this.room, this.x, this.y, damage, color, outlineColor),
    );
  };

  updateDrawXY = (delta: number) => {
    //putting this here bc i'm lazy
    this.updateHurtFrame(delta);
    this.animateDying(delta);
    this.updateCrushAnimation(delta);
    this.updateShadeColor(delta);
    //this.updateBloom(delta);

    if (!this.doneMoving()) {
      const speed = this.isPushAnimating()
        ? this.getPushEaseInDecayBase()
        : this.drawMoveSpeed;

      this.drawX *= speed ** delta;
      this.drawY *= speed ** delta;

      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
    }
    this.updatePushAnimFlag();
  };

  /**
   * Drive crush squish animation for death-clones (so the "crushed into wall" corpse compresses over time).
   * Kept centralized so both enemies and non-enemy entities (pushables, etc) animate consistently.
   */
  protected updateCrushAnimation = (delta: number): void => {
    if (!this.cloned || !this.crushed) return;
    this.crushAnim(delta);
  };

  private pushAnimActive: boolean = false;
  private pushAnimStartMag: number = 1;

  /**
   * Mark that this entity is currently being moved via a push (not its own normal movement).
   * This flag persists until `doneMoving()` so it is stable even if turn-based counters
   * like `skipNextTurns` get consumed/reset before draw offsets settle.
   */
  markPushedMove = (): void => {
    this.pushAnimActive = true;
    const mag = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.pushAnimStartMag = Math.max(0.0001, mag);
  };

  /**
   * 0..1 progress for the current pushed movement animation.
   * 0 = just pushed, 1 = visually settled (draw offsets near zero).
   */
  getPushAnimProgress01 = (): number => {
    if (!this.isPushAnimating()) return 1;
    const mag = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    const start = Math.max(0.0001, this.pushAnimStartMag);
    return Math.max(0, Math.min(1, 1 - mag / start));
  };

  protected updatePushAnimFlag = (): void => {
    if (this.pushAnimActive && this.doneMoving()) this.pushAnimActive = false;
  };

  protected getPushEaseInDecayBase = (): number => {
    const mag = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    const start = Math.max(0.0001, this.pushAnimStartMag);
    const t = Math.max(0, Math.min(1, 1 - mag / start)); // 0->1 as we approach the destination
    const tt = t * t; // ease-in (slow start, faster later)
    const slow = GameConstants.ENTITY_PUSH_DRAW_MOVE_SPEED_START;
    const fast = GameConstants.ENTITY_PUSH_DRAW_MOVE_SPEED_END;
    return slow + (fast - slow) * tt;
  };

  protected isPushAnimating = (): boolean => {
    // Prefer explicit push flag; fall back to legacy heuristic.
    if (this.pushAnimActive) return true;
    return (
      (this.skipNextTurns ?? 0) > 0 &&
      (Math.abs(this.drawX) > 0.01 || Math.abs(this.drawY) > 0.01)
    );
  };

  /**
   * Wrapper around `Game.drawMob` that applies the "crushed into wall" render transform
   * when this entity died via `crush()` (clone-only).
   */
  protected drawMobWithCrush(
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
    outlineColor?: string,
    outlineOpacity: number = 0,
    outlineOffset: number = 0,
    outlineManhattan: boolean = false,
  ): void {
    const rect = this.applyCrushToDrawRect({ dX, dY, dW, dH });
    Game.drawMob(
      sX,
      sY,
      sW,
      sH,
      rect.dX,
      rect.dY,
      rect.dW,
      rect.dH,
      shadeColor,
      shadeOpacity,
      fadeDir,
      outlineColor,
      outlineOpacity,
      outlineOffset,
      outlineManhattan,
    );
  }

  /**
   * Wrapper around `Game.drawObj` that applies the "crushed into wall" render transform
   * when this entity died via `crush()` (clone-only).
   */
  protected drawObjWithCrush(
    sX: number,
    sY: number,
    sW: number,
    sH: number,
    dX: number,
    dY: number,
    dW: number,
    dH: number,
    shadeColor = "black",
    shadeOpacity = 0,
    fadeDir?: "left" | "right" | "up" | "down",
  ): void {
    const rect = this.applyCrushToDrawRect({ dX, dY, dW, dH });
    Game.drawObj(
      sX,
      sY,
      sW,
      sH,
      rect.dX,
      rect.dY,
      rect.dW,
      rect.dH,
      shadeColor,
      shadeOpacity,
      fadeDir,
    );
  }

  setDrawXY = (x: number, y: number) => {
    this.drawX += this.x - x;
    this.drawY += this.y - y;
  };

  shouldSeeThrough = () => {
    const player = this.room.getPlayer();
    const entity = this.room.hasEnemy(this.x, this.y - 1);
    if (!(player?.x === this.x && player?.y === this.y - 1) && !entity) {
      this.seeThroughAlpha = 1;
    } else this.seeThroughAlpha = 0;
  };

  updateSeeThroughAlpha = (delta: number) => {
    if (this.softSeeThroughAlpha > this.seeThroughAlpha) {
      this.softSeeThroughAlpha -= 0.025 * delta;
    } else if (this.softSeeThroughAlpha < this.seeThroughAlpha) {
      this.softSeeThroughAlpha += 0.025 * delta;
    }
    if (this.softSeeThroughAlpha < 0.5) {
      this.softSeeThroughAlpha = 0.5;
    }
    if (this.softSeeThroughAlpha > 1) {
      this.softSeeThroughAlpha = 1;
    }
  };

  readonly tryMove = (x: number, y: number, collide: boolean = true) => {
    const canDestroyOthers = this.canDestroyOthers;
    let pointWouldBeIn = (someX: number, someY: number): boolean => {
      return (
        someX >= x && someX < x + this.w && someY >= y && someY < y + this.h
      );
    };

    let entityCollide = (entity: Entity): boolean => {
      let flag = true;
      if (entity.x >= x + this.w || entity.x + entity.w <= x) flag = false;
      if (entity.y >= y + this.h || entity.y + entity.h <= y) flag = false;
      if (
        canDestroyOthers &&
        entity.destroyable &&
        entity.destroyableByOthers &&
        entity.w <= 1 &&
        entity.h <= 1 &&
        flag === true
      ) {
        entity.hurt(this as any, entity.health);
        if (!this.canCrushOthers) {
          const closestTile = this.closestTile(entity as any);
          this.drawX += 1 * (closestTile.x - entity.x);
          this.drawY += 1 * (closestTile.y - entity.y);
        }
        const distanceToPlayer = Utils.distance(
          this.x,
          this.y,
          this.game.players[this.game.localPlayerID].x,
          this.game.players[this.game.localPlayerID].y,
        );
        this.game.shakeScreen(
          10 * this.drawX * (1 / distanceToPlayer),
          10 * this.drawY * (1 / distanceToPlayer),
          true,
        );

        flag = this.canCrushOthers ? false : true;
      }

      return flag;
    };

    let flag = false;
    for (const e of this.room.entities) {
      if (
        e !== this &&
        (e.z ?? 0) === (this.z ?? 0) &&
        entityCollide(e) &&
        collide
      ) {
        flag = true;
      }
    }
    if (flag) return;

    for (const i in this.game.players) {
      const pl: any = this.game.players[i];
      if ((pl?.z ?? 0) !== (this.z ?? 0)) continue;
      if (pointWouldBeIn(pl.x, pl.y)) {
        return;
      }
    }
    let tiles: Tile[] = [];
    for (let xx = 0; xx < this.w; xx++) {
      for (let yy = 0; yy < this.h; yy++) {
        if (
          !this.room.isSolidAt(x + xx, y + yy, this.z) &&
          !(this.room.roomArray[x + xx][y + yy] instanceof Door) &&
          !(this.room.roomArray[x + xx][y + yy] instanceof DownLadder)
        ) {
          tiles.push(this.room.roomArray[x + xx][y + yy]);
        } else {
          return;
        }
      }
    }
    for (let tile of tiles) {
      tile.onCollideEnemy(this);
    }
    this.x = x;
    this.y = y;
    this.bigEnemyShake();
  };

  bigEnemyShake = () => {
    if (this.w > 1 || this.h > 1) {
      setTimeout(() => {
        this.game.shakeScreen(0 * this.drawX, 5);
      }, 300);
    }
  };

  readonly getPlayer = () => {
    const maxDistance = 138291380921; // pulled this straight outta my ass
    let closestDistance = maxDistance;
    let closestPlayer = null;
    const myZ = (this as any).z ?? 0;
    for (const i in this.game.players) {
      if (this.game.rooms[this.game.players[i].levelID] === this.room) {
        const pl: any = this.game.players[i];
        if ((pl?.z ?? 0) !== myZ) continue;
        let distance = this.playerDistance(this.game.players[i]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = this.game.players[i];
        }
      }
    }

    if (closestDistance === maxDistance) return false;
    else return closestPlayer;
  };

  onHurt = (
    damage: number = 1,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {};

  hurt = (
    playerHitBy: Player | null,
    damage: number,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    this.handleEnemyCase(playerHitBy);
    this.hitBy = playerHitBy ?? null;
    const weapon = playerHitBy?.inventory?.getWeapon?.() ?? null;
    if (weapon) {
      this.lastHitWeapon = weapon;
      this.lastHitCombatSkill = weapon.combatSkill ?? "melee";
      this.lastHitKillXpMultiplier = weapon.killXpMultiplier ?? 1;
    }

    let hitShield = false;
    let shieldHealth = 0;
    if (this.shielded) {
      shieldHealth = this.shield.health;
      if (shieldHealth > 0) {
        this.shield.hurt(damage);
        hitShield = true;
      }
    }
    /*
    this.shadeColor = "red";
    setTimeout(() => {
      this.shadeColor = this.room.shadeColor;
    }, 100);
    */

    if (this.armored && this.health === this.defaultMaxHealth)
      Sound.playParry();

    this.health -= damage;
    //this.maxHealth -= shieldHealth;
    this.onHurt(damage, type);

    this.startHurting();
    if (this.hasDamageNumbers) this.createDamageNumber(damage, type);
    this.playHitSound();

    this.healthBar.hurt();

    // Emit damage done event for statistics tracking (only for enemies)
    if (this.isEnemy && playerHitBy) {
      globalEventBus.emit(EVENTS.DAMAGE_DONE, { amount: damage });
    }

    if (type === "none" || this.health <= 0 || !this.isEnemy) {
      this.createHitParticles();
    }

    if (this.health <= 0) {
      this.kill(playerHitBy ?? undefined);
      this.bloomAlpha = 0;
    } else this.hurtCallback();
  };

  wander = () => {
    // Store old position to check if move was successful
    const oldX = this.x;
    const oldY = this.y;

    // Try up to 4 times to find a valid move
    for (let attempts = 0; attempts < 4; attempts++) {
      // Choose a random direction
      const directions = [
        Direction.UP,
        Direction.DOWN,
        Direction.LEFT,
        Direction.RIGHT,
      ];
      const randomDirection =
        directions[Math.floor(Random.rand() * directions.length)];

      // Calculate target position based on direction
      let targetX = this.x;
      let targetY = this.y;

      switch (randomDirection) {
        case Direction.UP:
          targetY = this.y - 1;
          break;
        case Direction.DOWN:
          targetY = this.y + 1;
          break;
        case Direction.LEFT:
          targetX = this.x - 1;
          break;
        case Direction.RIGHT:
          targetX = this.x + 1;
          break;
      }

      // Try to move to the target position
      this.tryMove(targetX, targetY);
      this.setDrawXY(oldX, oldY);

      // If the move was successful, update direction and drawing, then break
      if (this.x !== oldX || this.y !== oldY) {
        this.direction = randomDirection;
        this.setDrawXY(targetX, targetY);
        break;
      }
    }
  };

  runAway = (wander: boolean = true) => {
    const player = this.getPlayer();
    if (!player) {
      this.wander();
      return;
    }
    //25% chance to trip
    if (Random.rand() < 0.25) return;

    const distance = Utils.distance(this.x, this.y, player.x, player.y);
    if (distance > 10) {
      this.wander();
      return;
    }

    // Store old position to check if move was successful
    const oldX = this.x;
    const oldY = this.y;

    // Calculate all possible positions with their distances
    const newPositions = [
      { x: this.x - 1, y: this.y },
      { x: this.x + 1, y: this.y },
      { x: this.x, y: this.y - 1 },
      { x: this.x, y: this.y + 1 },
    ].map((position) => ({
      position,
      distance: Utils.distance(player.x, player.y, position.x, position.y),
    }));

    // Sort by distance (furthest first)
    newPositions.sort((a, b) => b.distance - a.distance);

    // Choose either furthest or second furthest
    const chooseSecondFurthest = Random.rand() < 0.3;
    const chosenPosition =
      chooseSecondFurthest && newPositions.length > 1
        ? newPositions[1].position
        : newPositions[0].position;

    const targetX = chosenPosition.x;
    const targetY = chosenPosition.y;

    // Try to move to the target position
    this.tryMove(targetX, targetY);
    this.setDrawXY(oldX, oldY);

    // If the move was successful, update direction and drawing
    if (this.x !== oldX || this.y !== oldY) {
      // Set direction based on actual movement
      const dx = this.x - oldX;
      const dy = this.y - oldY;

      if (dx > 0) {
        this.direction = Direction.RIGHT;
      } else if (dx < 0) {
        this.direction = Direction.LEFT;
      } else if (dy > 0) {
        this.direction = Direction.DOWN;
      } else if (dy < 0) {
        this.direction = Direction.UP;
      }

      this.setDrawXY(targetX, targetY);
    } else {
      // If we couldn't move away, just wander
      this.wander();
    }
  };

  startHurting = () => {
    this.hurting = true;
    this.hurtFrame += 15;
    this.shadeColor = "#FF0000";
    this.shadeMultiplier = 1.5;
  };

  stopHurting = () => {
    this.hurting = false;
    this.hurtFrame = 0;
    this.shadeColor = "#000000";
  };

  interact = (player: Player) => {};

  handleEnemyCase = (playerHitBy?: Player) => {};

  playHitSound = () => {
    if (this.hitSound) Sound.delayPlay(this.hitSound, 50);
  };

  createHitParticles = (particleX?: number, particleY?: number) => {
    if (this.cloned) return;
    if (!this.hasHitParticles) return;
    if (!particleX) particleX = this.imageParticleX;
    if (!particleY) particleY = this.imageParticleY;
    ImageParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      particleX,
      particleY,
    );
  };

  protected dropLoot = () => {
    if (this.lootDropped) return;
    let coordX: number;
    let coordY: number;
    if (this.crushed) {
      coordX = this.lastX;
      coordY = this.lastY;
    } else {
      coordX = this.x;
      coordY = this.y;
    }

    if (this.drops.length === 0 && this.isEnemy) {
      this.drops.push(new Coin(this.room, this.x, this.y));
    }
    if (this.drops.length > 0) {
      // Consider all non-solid tiles within the entity's footprint (handles big enemies)
      const candidates: { x: number; y: number }[] = [];
      for (let dx = 0; dx < this.w; dx++) {
        for (let dy = 0; dy < this.h; dy++) {
          const tx = coordX + dx;
          const ty = coordY + dy;
          if (
            this.room.roomArray[tx] &&
            this.room.roomArray[tx][ty] &&
            !this.room.roomArray[tx][ty].isSolid()
          ) {
            candidates.push({ x: tx, y: ty });
          }
        }
      }

      // If no valid candidate tiles found, fall back to origin if it's valid
      if (
        candidates.length === 0 &&
        this.room.roomArray[coordX] &&
        this.room.roomArray[coordX][coordY] &&
        !this.room.roomArray[coordX][coordY].isSolid()
      ) {
        candidates.push({ x: coordX, y: coordY });
      }

      const used = new Set<string>();

      // Choose a random starting tile among candidates, then place subsequent drops on the next tiles
      const startIndex =
        candidates.length > 0
          ? Math.floor(Random.rand() * candidates.length)
          : 0;

      this.drops.forEach((drop, index) => {
        drop.level = this.room;
        if (candidates.length > 0) {
          const pos = candidates[(startIndex + index) % candidates.length];
          drop.x = pos.x;
          drop.y = pos.y;
          drop.z = this.z ?? 0;
          used.add(`${pos.x},${pos.y}`);
        } else if (
          this.room.roomArray[coordX] &&
          this.room.roomArray[coordX][coordY] &&
          !this.room.roomArray[coordX][coordY].isSolid()
        ) {
          drop.x = coordX;
          drop.y = coordY;
          drop.z = this.z ?? 0;
          used.add(`${coordX},${coordY}`);
        }
        this.room.items.push(drop);
        const lenAfterPush = this.room.items.length;
        drop.onDrop();

        // Some items (e.g., paired fragments) can replace themselves in `onDrop()` by removing
        // the original and spawning an alternate item at the same location. If we always call
        // `autoPickup()` on the original instance we can end up picking up the wrong piece.
        let pickupCandidate: Item | undefined = drop;
        if (!this.room.items.includes(drop)) {
          const addedByOnDrop = this.room.items.slice(lenAfterPush);
          const replacement = addedByOnDrop.find(
            (i) => i.x === drop.x && i.y === drop.y && i.z === drop.z,
          );
          pickupCandidate = replacement;
        }

        if (this.name !== "chest" && pickupCandidate) {
          // Only auto-pickup if the candidate still exists in the room.
          if (this.room.items.includes(pickupCandidate))
            pickupCandidate.autoPickup();
        }
      });

      // For big enemies, drop coins on any remaining footprint tiles not chosen above
      if (this.isEnemy && (this.w > 1 || this.h > 1) && candidates.length > 0) {
        const remaining = candidates.filter((p) => !used.has(`${p.x},${p.y}`));
        remaining.forEach((p) => {
          const coin = new Coin(this.room, p.x, p.y);
          coin.z = this.z ?? 0;
          coin.level = this.room;
          this.room.items.push(coin);
          coin.onDrop();
          if (this.name !== "chest") coin.autoPickup();
        });
      }
    }
    this.lootDropped = true;
  };

  kill = (player?: Player) => {
    this.dead = true;

    if (this.cloned) return;
    if (player) this.hitBy = player;

    this.emitEnemyKilled();
    this.dropLoot();

    const deadEntity = this.clone();

    this.room.deadEntities.push(deadEntity);
    //this.room.entities = this.room.entities.filter((e) => e !== this);
    this.removeLightSource(this.lightSource);

    this.uniqueKillBehavior();
  };

  uniqueKillBehavior = () => {};

  updateHurtFrame = (delta: number) => {
    if (this.hurting) {
      this.hurtFrame -= delta;
      if (this.hurtFrame < 0) {
        this.stopHurting();
      }
    }
  };

  shadeAmount = () => {
    if (
      (GameConstants.SMOOTH_LIGHTING &&
        !GameConstants.SHADE_INLINE_IN_ENTITY_LAYER) ||
      GameConstants.SHADING_DISABLED
    )
      return 0;
    if (!this.room.softVis[this.x]) return 0;
    let softVis = this.room.softVis[this.x][this.y] * 1;
    if (this.shadeMultiplier > 1)
      return GameConstants.applyShadeForSprites(Math.min(1, softVis));
    return GameConstants.applyShadeForSprites(softVis);
  };

  updateShadeColor = (delta: number) => {
    if (this.shadeMultiplier > 1) this.shadeMultiplier -= 0.01 * delta;
    if (this.shadeMultiplier < 1) this.shadeMultiplier = 1;
    let updated = false;

    // Convert hex color to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b];
    };
    // Convert RGB to hex color
    const rgbToHex = (rgb: [number, number, number]): string => {
      const [r, g, b] = rgb;
      return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)
          .toUpperCase()
      );
    };

    const [softR, softG, softB] = hexToRgb(this.softShadeColor);
    const [targetR, targetG, targetB] = hexToRgb(this.shadeColor);

    // Calculate differences
    let diffR = softR - targetR;
    let diffG = softG - targetG;
    let diffB = softB - targetB;

    let flagR = false;
    let flagG = false;
    let flagB = false;
    if (Math.abs(diffR) > 1) flagR = true;
    if (Math.abs(diffG) > 1) flagG = true;
    if (Math.abs(diffB) > 1) flagB = true;

    if (!flagR && !flagG && !flagB) {
      return this.softShadeColor;
    }

    let softShadeRgb = [softR, softG, softB];

    // Apply smoothing similar to fadeLighting
    if (flagR) {
      diffR *= 0.1 * delta;
      softShadeRgb[0] = this.room.clamp(Math.round(softR - diffR), 0, 255);
      updated = true;
    }

    if (flagG) {
      diffG *= 0.1 * delta;
      softShadeRgb[1] = this.room.clamp(Math.round(softG - diffG), 0, 255);
      updated = true;
    }

    if (flagB) {
      diffB *= 0.1 * delta;
      softShadeRgb[2] = this.room.clamp(Math.round(softB - diffB), 0, 255);
      updated = true;
    }

    if (updated) {
      this.softShadeColor = rgbToHex(softShadeRgb as [number, number, number]);
    }

    return this.softShadeColor;
  };

  emitEnemyKilled = () => {
    if (!this.isEnemy) return;
    const baseXp = computeEnemyKillBaseXp({
      maxHealth: this.defaultMaxHealth,
      depth: this.room.depth,
    });
    const skill = this.lastHitCombatSkill ?? "melee";
    const xpMultiplier =
      this.lastHitKillXpMultiplier && this.lastHitKillXpMultiplier > 0
        ? this.lastHitKillXpMultiplier
        : 1;
    const xp = Math.ceil(baseXp * xpMultiplier);
    globalEventBus.emit(EVENTS.ENEMY_KILLED, {
      enemyId: this.name,
      xp: xp,
      skill,
      baseXp,
      xpMultiplier,
    });
    const player = this.getPlayer();
    if (!player) return;

    if (GameConstants.XP_POPUP_ENABLED) {
      setTimeout(() => {
        this.room.particles.push(new XPPopup(this.room, this.x, this.y, xp));
      }, 350);
    }
  };

  doneMoving = (): boolean => {
    let EPSILON = 0.01;
    return Math.abs(this.drawX) < EPSILON && Math.abs(this.drawY) < EPSILON;
  };

  nearestPlayer = (): [number, Player] | false => {
    const maxDistance = 138291380921; // pulled this straight outta my ass
    let closestDistance = maxDistance;
    let closestPlayer = null;
    const myZ = this.z ?? 0;
    for (const i in this.game.players) {
      if (this.game.rooms[this.game.players[i].levelID] === this.room) {
        const pl = this.game.players[i];
        if (pl.z !== myZ) continue;
        let distance = this.playerDistance(this.game.players[i]);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = this.game.players[i];
        }
      }
    }

    if (closestDistance === maxDistance) return false;
    else return [closestDistance, closestPlayer];
  };

  playerDistance = (player: Player): number => {
    return Math.max(Math.abs(this.x - player.x), Math.abs(this.y - player.y));
  };

  closestTile = (player: Player) => {
    let closestTile = { x: 0, y: 0 };
    let closestDistance = 1000000;
    for (let x = 0; x < this.w; x++) {
      for (let y = 0; y < this.h; y++) {
        let distance =
          Math.abs(player.x - (this.x + x)) + Math.abs(player.y - (this.y + y));
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTile = { x: this.x + x, y: this.y + y };
        }
      }
    }
    return closestTile;
  };

  facePlayer = (player: Player) => {
    // For 1x1 entities, use the existing perfect logic
    if (this.w === 1 && this.h === 1) {
      const entityCenterX = this.x + 0.5;
      const entityCenterY = this.y + 0.5;

      let dx = player.x - entityCenterX;
      let dy = player.y - entityCenterY;

      if (Math.abs(dx) === Math.abs(dy)) {
        // just moved, already facing player
      } else if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.direction = Direction.RIGHT;
        if (dx < 0) this.direction = Direction.LEFT;
      } else {
        if (dy > 0) this.direction = Direction.DOWN;
        if (dy < 0) this.direction = Direction.UP;
      }
      return;
    }

    // For bigger entities, check if player shares any row or column
    const sharesRow = player.y >= this.y && player.y < this.y + this.h;
    const sharesColumn = player.x >= this.x && player.x < this.x + this.w;

    // If sharing both row and column, player is overlapping - don't change direction
    if (sharesRow && sharesColumn) {
      return;
    }
    const closestTile = this.closestTile(player);

    let dx = player.x - closestTile.x;
    let dy = player.y - closestTile.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) this.direction = Direction.RIGHT;
      if (dx < 0) this.direction = Direction.LEFT;
    } else {
      if (dy > 0) this.direction = Direction.DOWN;
      if (dy < 0) this.direction = Direction.UP;
    }
  };

  animateDying = (delta: number) => {
    if (this.cloned) {
      //this.frame = 0;
      this.dyingFrame -= delta / 3;
      this.alpha = Math.max(0, this.alpha - delta / 50);

      if (this.dyingFrame <= 0) {
        this.dead = true;
        this.dying = false;
        this.uniqueKillBehavior();
        this.room.clearDeadStuff();
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    if (this.hasShadow) {
      this.drawShadow(delta);
    }
    /*
    Game.drawMob(
      0,
      0,
      1,
      1,
      this.x - this.drawX,
      this.y - this.drawY,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
    */
    Game.drawMob(
      this.tileX,
      this.tileY + this.direction * 2,
      1,
      2,
      this.x - this.drawX,
      this.y - this.drawYOffset - this.drawY,
      1,
      2,
      this.shadeColor,
      this.shadeAmount(),
      undefined,
      this.outlineColor(),
      this.outlineOpacity(),
    );

    /*if (this.crushed) {
      this.crushAnim(delta);
    }*/
    Game.ctx.globalAlpha = 1;
  };

  // Draw a soft blurred shadow under the entity using the shared Shadow utility
  drawShadow = (delta: number) => {
    if (this.cloned) return;
    Shadow.draw(
      this.x - this.drawX,
      this.y - this.drawY,
      this.w,
      this.h,
      this.extendShadow,
      this.shadowOpacity,
    );
  };

  tick = () => {
    this.behavior();
    if (this.shielded) this.shield.updateLightSourcePos();
  };

  emitEntityData = (): void => {
    globalEventBus.emit("EntityData", {
      name: this.name,
      location: { x: this.x, y: this.y, z: this.z ?? 0 },
    });
  };

  drawTopLayer = (delta: number) => {
    //this.updateDrawXY(delta);

    this.drawableY = this.y - this.drawY;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true,
    );
  };

  drawSleepingZs = (delta: number, offsetX = 0, offsetY = 0) => {
    this.sleepingZFrame += delta;

    let numZs = 2;
    let t = this.sleepingZFrame * 0.01; // 0 <= t < 1
    t -= Math.floor(t);
    //let whichway = Math.floor(this.sleepingZFrame * 0.02 / numZs) % 2;
    for (let off = numZs - 1; off >= 0; off--) {
      let yoff = (t + off) * 7;
      let alpha = Math.min(1 - (t + off) / numZs, (2 * (t + off)) / numZs);

      let xoff = 0;
      if (off === 0) xoff = 1;
      if (t >= 0.33 && t < 0.66) xoff = off;
      if (t >= 0.33 && t < 0.66) xoff = off;

      let width = Game.measureText("Z").width;
      if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = alpha;
      Game.fillTextOutline(
        "Z",
        (this.x + 0.5) * GameConstants.TILESIZE - width / 2 + xoff + offsetX,
        (this.y - 0.6) * GameConstants.TILESIZE - yoff + offsetY,
        GameConstants.OUTLINE,
        "white",
      );
      Game.ctx.globalAlpha = 1;
    }
  };

  drawExclamation = (delta: number, offsetX = 0, offsetY = 0) => {
    this.exclamationFrame += delta;

    let yoff: number | false = 0;
    let yoffs: Array<number | false> = [0, -1, -2, -3, -5, -7, -4];
    if (this.exclamationFrame > yoffs.length) yoff = yoffs[yoffs.length - 1];
    else yoff = yoffs[this.exclamationFrame];

    let width = Game.measureText("!").width;
    Game.ctx.globalAlpha = 1;
    if (yoff !== false) {
      Game.fillTextOutline(
        "!",
        (this.x + 0.5) * GameConstants.TILESIZE - width / 2 + offsetX,
        (this.y - 0.75) * GameConstants.TILESIZE + yoff + offsetY,
        GameConstants.OUTLINE,
        GameConstants.WARNING_RED,
      );
    }
  };

  crush = (pushDX?: number, pushDY?: number) => {
    this.crushed = true;
    // Determine crush direction:
    // - Prefer explicit direction from the caller (push/knockback knows this).
    // - Otherwise fall back to drawX/drawY (some callers set these to the push direction).
    const dx =
      typeof pushDX === "number" && Number.isFinite(pushDX) ? Math.sign(pushDX) : Math.sign(this.drawX ?? 0);
    const dy =
      typeof pushDY === "number" && Number.isFinite(pushDY) ? Math.sign(pushDY) : Math.sign(this.drawY ?? 0);
    this.crushPushDX = dx;
    this.crushPushDY = dy;
    this.crushVertical = dy !== 0;

    // Crushed entities should not also animate as "being pushed".
    // Snap any push draw offsets immediately; the visual is handled by crush squish + draw compensation.
    this.pushAnimActive = false;
    this.pushAnimStartMag = 1;
    this.drawX = 0;
    this.drawY = 0;

    // The entity is logically crushed *into* the blocking tile; move it into the wall immediately.
    // (The death-clone will render pulled out via applyCrushToDrawRect.)
    if (dx !== 0 || dy !== 0) {
      const nx = this.x + dx;
      const ny = this.y + dy;
      // Only shift if the tile exists (it may be solid; that's expected).
      if (this.room?.roomArray?.[nx]?.[ny]) {
        this.lastX = this.x;
        this.lastY = this.y;
        this.x = nx;
        this.y = ny;
      }
    }

    // Reset squish scale so the animation always starts from full size.
    this.crushX = 1;
    this.crushY = 1;
    this.crushAnimStartScale = 1;

    this.kill();
  };

  protected getCrushEaseInDecayBase = (): number => {
    // Ease-in in terms of decay base: start closer to 1 (slow), move toward a smaller base (fast).
    const currentScale = this.crushVertical ? (this.crushY ?? 1) : (this.crushX ?? 1);
    const start = Math.max(0.0001, this.crushAnimStartScale || 1);
    const t = Math.max(0, Math.min(1, 1 - currentScale / start)); // 0->1 as we compress
    const tt = t * t; // ease-in
    const slow = GameConstants.ENTITY_PUSH_DRAW_MOVE_SPEED_START;
    const fast = GameConstants.ENTITY_PUSH_DRAW_MOVE_SPEED_END;
    return slow + (fast - slow) * tt;
  };

  crushAnim = (delta: number) => {
    // Follow the same ease-in profile as pushed movement (slow start, speed up).
    const decayBase = this.getCrushEaseInDecayBase();
    const decay = Math.pow(decayBase, delta);
    if (this.crushVertical && this.crushY >= 0) {
      this.crushY *= decay;
    } else if (this.crushX >= 0) {
      this.crushX *= decay;
    }
  };

  /**
   * Apply a "crushed into wall" rendering transform:
   * - Shrinks width/height using crushX/crushY
   * - Offsets the draw position so the clone doesn't render fully inside the crush tile
   * - Adds a scale-compensation offset because scaling happens from the top-left corner
   */
  protected applyCrushToDrawRect = (rect: {
    dX: number;
    dY: number;
    dW: number;
    dH: number;
  }): { dX: number; dY: number; dW: number; dH: number } => {
    // Only apply to the dying clone (post-death render). Live entities should not be affected.
    if (!this.crushed || !this.cloned) return rect;

    const baseW = rect.dW;
    const baseH = rect.dH;
    const crushX = this.crushX ?? 1;
    const crushY = this.crushY ?? 1;
    const dW = baseW * crushX;
    const dH = baseH * crushY;

    // Position compensation:
    // The crushed clone's logical position is inside the wall tile; we need to pull it back out
    // by ~1 tile. Additionally, as the sprite shrinks, we compensate by ~half the shrink distance.
    //
    // Empirically, the right/down crush directions tend to "bounce" if we use the same rule as left/up.
    // So we use direction-aware anchoring:
    // - pushing LEFT/UP: pull out by 1 tile + half the shrink distance (keeps it locked on the wall edge)
    // - pushing RIGHT/DOWN: pull out by 1 tile but anchor using (1 - half the current size), not half-shrink
    const pushDX = this.crushPushDX ?? 0;
    const pushDY = this.crushPushDY ?? 0;
    const shrinkDX = baseW - dW;
    const shrinkDY = baseH - dH;
    const shrink = shrinkDX > shrinkDY ? dW / baseW : dH / baseH;
    const differential = shrink * 0.5 + 0.5
    let offX = 0;
    let offY = 0;
    let scaleX = 0
    let scaleY = 0

    if (pushDX < 0) {
      // Pulled out to the right; start at +1 tile, then increase slightly as it shrinks.
      offX = differential + shrinkDX * 0.5;
      scaleY = (1 - shrink);
      //enemies generally have smaller sprites than the measurements, so we need to compensate for that
      offY = (-scaleY - (0.25 * scaleY)) * 0.5
    } else if (pushDX > 0) {
      // Pulled out to the left; anchor via (1 - half current width) to avoid over-travel.
      offX = (-differential + (shrinkDX * 0.5));
      scaleY = (1 - shrink);
      offY = (-scaleY - (0.25 * scaleY)) * 0.5
    }

    if (pushDY < 0) {
      // Pulled out downward
      offY = differential + shrinkDY * 0.75;
      scaleX = (1 - shrink);
      offX = -scaleX * 0.5
    } else if (pushDY > 0) {
      // Pulled out upward
      offY = (-differential + (shrinkDY * 0.75));
      scaleX = (1 - shrink);
      offX = -scaleX * 0.5
    }

    return {
      dX: rect.dX + offX,
      dY: rect.dY + offY,
      dW: dW + scaleX,
      dH: dH + scaleY,
    };
  };
  //set rumbling in the tick function for the enemies
  //create variables for the rumbling x and y offsets
  //return the rumbling x and y offsets
  //add the rumbling x and y offsets to the enemy's x and y in the draw function
  rumble = (rumbling: boolean, frame: number, direction?: Direction) => {
    let rumbleOffset = { x: 0, y: 0 };

    if (rumbling) {
      const isOddFrame = Math.floor(frame) % 2 === 1;
      const offset = isOddFrame ? 0.0325 : 0;

      if (direction === Direction.LEFT || direction === Direction.RIGHT) {
        rumbleOffset.y = offset;
      } else if (
        direction === Direction.UP ||
        direction === Direction.DOWN ||
        !direction
      ) {
        rumbleOffset.x = offset;
      }
      this.animationSpeed = 0.2;
    }
    return rumbleOffset;
  };

  attemptProjectilePlacement = (
    offsets: { x: number; y: number }[],
    projectileClass: new (parent: Entity, x: number, y: number) => Projectile,
    collide: boolean = false,
    clearPath: boolean = true,
    targetingPlayer: boolean = false,
  ) => {
    for (const offset of offsets) {
      const targetX = this.x + offset.x;
      const targetY = this.y + offset.y;

      if (
        !this.isValidProjectilePosition(targetX, targetY, collide, clearPath)
      ) {
        if (targetingPlayer) break;
        continue;
      }

      this.placeProjectile(projectileClass, targetX, targetY);

      if (targetingPlayer) break;
    }
  };

  private isValidProjectilePosition = (
    x: number,
    y: number,
    collide: boolean,
    clearPath: boolean,
  ): boolean => {
    if (!this.isWithinRoomBounds(x, y)) return false;
    if (clearPath && !this.isPathClear(this.x, this.y, x, y)) return false;
    if (collide && this.isEntityColliding(x, y)) return false;

    const targetTile = this.room.roomArray[x][y];
    return targetTile && !targetTile.isSolid() && !targetTile.isDoor;
  };

  private isEntityColliding = (x: number, y: number): boolean => {
    return this.room.entities.some(
      (entity) => entity.x === x && entity.y === y && entity.z === this.z,
    );
  };

  private placeProjectile = (
    projectileClass: new (
      parent: Entity,
      x: number,
      y: number,
      color?: [number, number, number],
    ) => Projectile,
    x: number,
    y: number,
    color?: [number, number, number],
  ) => {
    this.room.projectiles.push(new projectileClass(this, x, y, color));
  };

  isPathClear = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
  ): boolean => {
    const dx = Math.sign(endX - startX);
    const dy = Math.sign(endY - startY);
    let x = startX;
    let y = startY;

    while (x !== endX || y !== endY) {
      x += dx;
      y += dy;
      if (
        !this.isWithinRoomBounds(x, y) ||
        this.room.roomArray[x][y]?.isSolid()
      ) {
        return false;
      }
    }

    return true;
  };

  calculateProjectileOffsets(
    targetX: number,
    targetY: number,
    attackLength: number,
  ): { x: number; y: number }[] {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    let offsets = [];

    // Normalize the direction
    const stepX = dx !== 0 ? Math.sign(dx) : 0;
    const stepY = dy !== 0 ? Math.sign(dy) : 0;

    // Generate offsets for the full attackLength
    for (let i = 1; i <= attackLength; i++) {
      offsets.push({ x: i * stepX, y: i * stepY });
    }

    return offsets;
  }

  getLuminance = (): number => {
    if (this.room.roomArray[this.x][this.y]) {
      return this.room.vis[this.x][this.y];
    }
    return null;
  };

  getAverageLuminance = (): number => {
    let total = 0;
    let count = 0;
    for (let x = this.x - 2; x <= this.x + 2; x++) {
      if (this.room.roomArray[x] && this.room.roomArray[x][this.y]) {
        for (let y = this.y - 2; y <= this.y + 2; y++) {
          if (this.room.vis[x][y]) {
            total += this.room.vis[x][y];
            count++;
          }
        }
      }
    }
    return total / count;
  };

  getOpenTile = (): { x: number; y: number } => {
    let x, y;
    do {
      x = Math.floor(Random.rand() * 3 + this.x - 1);
      y = Math.floor(Random.rand() * 3 + this.y - 1);
    } while (
      (x === this.x && y === this.y) ||
      this.room.roomArray[x][y].isSolid() ||
      this.room.roomArray[x][y] instanceof DownLadder ||
      this.room.roomArray[x][y] instanceof Door ||
      this.room.roomArray[x][y] instanceof Wall ||
      this.room.entities.some((e) => e.x === x && e.y === y && e.z === this.z)
    );

    if (!x || !y) return { x: this.x, y: this.y };
    return { x, y };
  };

  makeBigHitWarnings = () => {
    switch (this.direction) {
      case Direction.LEFT:
        this.makeHitWarnings(this.x, this.y);
        this.makeHitWarnings(this.x, this.y + 1);
        break;
      case Direction.RIGHT:
        this.makeHitWarnings(this.x + 1, this.y);
        this.makeHitWarnings(this.x + 1, this.y + 1);
        break;
      case Direction.UP:
        this.makeHitWarnings(this.x, this.y);
        this.makeHitWarnings(this.x + 1, this.y);
        break;
      case Direction.DOWN:
        this.makeHitWarnings(this.x, this.y + 1);
        this.makeHitWarnings(this.x + 1, this.y + 1);
        break;
    }
  };

  makeHitWarnings = (
    hx: number = this.x,
    hy: number = this.y,
    arrowsOnly: boolean = false,
    directionOverride: null | "diagonal" | "orthogonal" | "forward" = null,
  ) => {
    if (this.unconscious || (this.isEnemy && !(this as unknown as Enemy).seenPlayer)) return;
    const player: Player = this.getPlayer();
    const isPlayerOnTile = player.x === hx && player.y === hy;
    const cullFactor = isPlayerOnTile ? 0 : this.hitWarningCullFactor;

    let orthogonal = this.orthogonalAttack;
    let diagonal = this.diagonalAttack;
    let forwardOnly = this.forwardOnlyAttack;
    const direction = this.direction;
    const orthoRange = this.attackRange;
    const diagRange = this.diagonalAttackRange;

    switch (directionOverride) {
      case "diagonal":
        diagonal = true;
        orthogonal = false;
        forwardOnly = false;
        break;
      case "orthogonal":
        orthogonal = true;
        diagonal = false;
        forwardOnly = false;
        break;
      case "forward":
        forwardOnly = true;
        orthogonal = true;
        diagonal = false;
        break;
    }

    const generateOffsets = (
      isOrthogonal: boolean,
      range: number,
    ): number[][] => {
      const baseOffsets = isOrthogonal
        ? [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]
        : [
            [-1, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
          ];
      return baseOffsets.flatMap(([dx, dy]) =>
        Array.from({ length: range }, (_, i) => [(i + 1) * dx, (i + 1) * dy]),
      );
    };

    const directionOffsets = {
      [Direction.LEFT]: [-1, 0],
      [Direction.RIGHT]: [1, 0],
      [Direction.UP]: [0, -1],
      [Direction.DOWN]: [0, 1],
    };

    let offsets: number[][] = [];
    if (forwardOnly) {
      const [dx, dy] = directionOffsets[direction];
      offsets = Array.from({ length: orthoRange }, (_, i) => [
        (i + 1) * dx,
        (i + 1) * dy,
      ]);
    } else {
      if (orthogonal) offsets.push(...generateOffsets(true, orthoRange));
      if (diagonal) offsets.push(...generateOffsets(false, diagRange));
    }

    const warningCoordinates = offsets
      .map(([dx, dy]) => ({
        x: dx,
        y: dy,
        distance: Utils.distance(dx, dy, player.x - hx, player.y - hy),
      }))
      .sort((a, b) => a.distance - b.distance);

    const keepCount = Math.ceil(warningCoordinates.length * (1 - cullFactor));
    const culledWarnings = warningCoordinates.slice(0, keepCount);

    culledWarnings.forEach(({ x, y }) => {
      const targetX = hx + x;
      const targetY = hy + y;
      if (this.isWithinRoomBounds(targetX, targetY)) {
        // For 2x2+ enemies, avoid placing warnings on tiles the attacker occupies.
        // This is the simplest "overlap" cull (tile-space).
        if (this.occupiesTile(targetX, targetY, this.z ?? 0)) return;

        const hitWarning = new HitWarning(
          this.game,
          targetX,
          targetY,
          hx,
          hy,
          true,
          arrowsOnly,
          this,
        );
        this.room.hitwarnings.push(hitWarning);
        //this.hitWarnings.push(hitWarning);
      }
    });
  };

  isWithinRoomBounds = (x: number, y: number): boolean => {
    const xInBounds =
      x >= this.room.roomX && x < this.room.roomX + this.room.width;
    const yInBounds =
      y >= this.room.roomY && y < this.room.roomY + this.room.height;
    const tileExists =
      this.room.roomArray[x] && this.room.roomArray[x][y] !== undefined;

    return xInBounds && yInBounds && tileExists;
  };
}
