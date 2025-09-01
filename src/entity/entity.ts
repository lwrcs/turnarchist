import { Direction, Game } from "../game";
import { Room } from "../room/room";
import { Bones } from "../tile/bones";
import { Player } from "../player/player";
import { Floor } from "../tile/floor";
import { HealthBar } from "../drawable/healthbar";
import { Drawable } from "../drawable/drawable";
import { Item } from "../item/item";
import { GameConstants } from "../game/gameConstants";
import { HitWarning } from "../drawable/hitWarning";
import { Projectile } from "../projectile/projectile";
import { Utils } from "../utility/utils";
import { globalEventBus } from "../event/eventBus";
import type { LightSource } from "../lighting/lightSource";
import { EVENTS } from "../event/events";
import { DamageNumber } from "../particle/damageNumber";
import { DownLadder } from "../tile/downLadder";
import { Door } from "../tile/door";
import { Wall } from "../tile/wall";
import { Lighting } from "../lighting/lighting";
import { IdGenerator } from "../globalStateManager/IdGenerator";
import { Shadow } from "../drawable/shadow";

import { DropTable } from "../item/dropTable";
import { Weapon } from "../item/weapon/weapon";
import { EnemyShield } from "../projectile/enemyShield";
import { Sound } from "../sound/sound";
import { ImageParticle } from "../particle/imageParticle";
import { Enemy } from "./enemy/enemy";
import { Particle } from "../particle/particle";
import { DeathParticle } from "../particle/deathParticle";
import { GameplaySettings } from "../game/gameplaySettings";
import { Coin } from "../item/coin";
import { Random } from "../utility/random";
import { XPPopup } from "../particle/xpPopup";
import { Tile } from "src/tile/tile";

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
  location: { x: number; y: number };
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
  protected hitBy: Player;
  protected crushX: number;
  protected crushY: number;
  protected crushVertical: boolean;
  protected crushed: boolean;
  protected rumbling: boolean;
  protected animationSpeed: number;
  drawYOffset: number;
  name: string;
  protected orthogonalAttack: boolean;
  protected diagonalAttack: boolean;
  protected forwardOnlyAttack: boolean;
  protected attackRange: number;
  protected diagonalAttackRange: number;
  lightSource: LightSource;
  drawMoveSpeed: number;
  unconscious: boolean;
  hitWarnings: HitWarning[];
  imageParticleX: number = 0;
  imageParticleY: number = 26;
  dropChance: number = 1;
  isEnemy: boolean;
  shielded: boolean;
  //shieldHealth: number;
  frame: number;
  shield: EnemyShield;
  shieldedBefore: boolean;
  //shadeColor: string;
  shadeMultiplier: number = 1;
  hurting: boolean;
  hurtFrame: number;
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
  // Shadow rendering resources moved to Shadow class

  private _imageParticleTiles: { x: number; y: number };
  hitSound: () => void;

  constructor(room: Room, game: Game, x: number, y: number) {
    super();
    this.globalId = IdGenerator.generate("EN");

    // Check if we're in cloning mode
    const isCloning = (this.constructor as any).__isCloning;

    // Set cloned status immediately if we're cloning
    if (isCloning) {
      this.cloned = true;
    } else this.cloned = false;

    // Only set the absolute minimum required properties if cloning
    this.room = room;
    this.x = x;
    this.y = y;
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
    this.pushable = false;
    this.chainPushable = true;
    this.interactable = false;
    this.healthBar = new HealthBar();
    this.alertTicks = 0;
    this.exclamationFrame = 0;
    this.lastX = x;
    this.lastY = y;
    this.hitBy = null;
    this.crushX = 1;
    this.crushY = 1;
    this.crushVertical = false;
    this.crushed = false;
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
    if (this.drop) this.drops.push(this.drop);
  }

  static add<
    T extends new (
      room: Room,
      game: Game,
      x: number,
      y: number,
      ...rest: any[]
    ) => Entity,
  >(this: T, room: Room, game: Game, x: number, y: number, ...rest: any[]) {
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
      alpha: original.alpha,
      shadeColor: original.shadeColor,
      shadeMultiplier: original.shadeMultiplier,
      softShadeColor: original.softShadeColor,
      hasBloom: original.hasBloom,
      bloomColor: original.bloomColor,
      bloomAlpha: 1,
      softBloomAlpha: 1,
      dyingFrame: 30,
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

  hoverText = () => {
    return this.name;
  };

  get imageParticleTiles() {
    return this._imageParticleTiles;
  }

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
    this.updateShadeColor(delta);
    //this.updateBloom(delta);

    if (!this.doneMoving()) {
      this.drawX *= this.drawMoveSpeed ** delta;
      this.drawY *= this.drawMoveSpeed ** delta;

      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
    }
  };

  setDrawXY = (x: number, y: number) => {
    this.drawX += this.x - x;
    this.drawY += this.y - y;
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
        entity.w <= 1 &&
        entity.h <= 1 &&
        flag === true
      ) {
        entity.hurt(this as any, entity.health);

        flag = false;
      }

      return flag;
    };

    for (const e of this.room.entities) {
      if (e !== this && entityCollide(e) && collide) {
        return;
      }
    }
    for (const i in this.game.players) {
      if (pointWouldBeIn(this.game.players[i].x, this.game.players[i].y)) {
        return;
      }
    }
    let tiles: Tile[] = [];
    for (let xx = 0; xx < this.w; xx++) {
      for (let yy = 0; yy < this.h; yy++) {
        if (
          !this.room.roomArray[x + xx][y + yy].isSolid() &&
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
    for (const i in this.game.players) {
      if (this.game.rooms[this.game.players[i].levelID] === this.room) {
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
    playerHitBy: Player,
    damage: number,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    this.handleEnemyCase(playerHitBy);

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

    if (type === "none" || this.health <= 0 || !this.isEnemy) {
      this.createHitParticles();
    }

    if (this.health <= 0) {
      this.kill();
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

  runAway = () => {
    const player = this.getPlayer();
    if (!player) {
      this.wander();
      return;
    }

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
      this.drops.forEach((drop) => {
        drop.level = this.room;
        if (!this.room.roomArray[coordX][coordY].isSolid()) {
          drop.x = coordX;
          drop.y = coordY;
        }
        this.room.items.push(drop);
        drop.onDrop();
        if (this.name !== "chest") drop.autoPickup();
      });
    }
  };

  kill = (player?: Player) => {
    this.dead = true;

    if (this.cloned) return;

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
      GameConstants.SMOOTH_LIGHTING &&
      !GameConstants.SHADE_INLINE_IN_ENTITY_LAYER
    )
      return 0;
    if (!this.room.softVis[this.x]) return 0;
    let softVis = this.room.softVis[this.x][this.y] * 1;
    if (this.shadeMultiplier > 1) return Math.min(1, softVis);
    return softVis;
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
    let depthMultiplier = 1.5 ** this.room.depth; //Math.log((this.room.depth + 1) * 5);
    console.log(depthMultiplier);

    let multiplier = 1;
    if (this.isEnemy) multiplier = 5;
    const xp = Math.ceil(this.defaultMaxHealth * multiplier * depthMultiplier);
    if (!this.isEnemy) return;
    globalEventBus.emit(EVENTS.ENEMY_KILLED, {
      enemyId: this.name,
      xp: xp,
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
    for (const i in this.game.players) {
      if (this.game.rooms[this.game.players[i].levelID] === this.room) {
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
    );

    /*if (this.crushed) {
      this.crushAnim(delta);
    }*/
    Game.ctx.globalAlpha = 1;
  };

  // Draw a soft blurred shadow under the entity using the shared Shadow utility
  drawShadow = (delta: number) => {
    if (this.cloned) return;
    Shadow.draw(this.x - this.drawX, this.y - this.drawY, this.w, this.h);
  };

  tick = () => {
    this.behavior();
    if (this.shielded) this.shield.updateLightSourcePos();
  };

  emitEntityData = (): void => {
    globalEventBus.emit("EntityData", {
      name: this.name,
      location: { x: this.x, y: this.y },
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

  crush = () => {
    this.crushed = true;
    let player: Player;
    for (let i in this.game.players) {
      player = this.game.players[i];
    }
    if (this.x == player.x) {
      this.crushVertical = true;
    }
    this.kill();
  };

  crushAnim = (delta: number) => {
    if (this.crushVertical && this.crushY >= 0) {
      this.crushY *= 0.95;
    } else if (this.crushX >= 0) {
      this.crushX *= 0.95;
    }
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
      (entity) => entity.x === x && entity.y === y,
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
      this.room.entities.some((e) => e.x === x && e.y === y)
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
    if (this.unconscious) return;
    const player: Player = this.getPlayer();
    const isPlayerOnTile = player.x === hx && player.y === hy;
    const cullFactor = isPlayerOnTile ? 0 : 0.45;

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
