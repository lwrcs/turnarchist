import { Direction, Game } from "../game";
import { Room } from "../room";
import { Bones } from "../tile/bones";
import { LevelConstants } from "../levelConstants";
import { Player } from "../player";
import { DeathParticle } from "../particle/deathParticle";
import { Floor } from "../tile/floor";
import { GenericParticle } from "../particle/genericParticle";
import { HealthBar } from "../healthbar";
import { Drawable } from "../drawable";
import { Item } from "../item/item";
import { GameConstants } from "../gameConstants";
import { HitWarning } from "../hitWarning";
import { Sound } from "../sound";
import { Projectile } from "../projectile/projectile";
import { Utils } from "../utils";
import { globalEventBus } from "../eventBus";
import { LightSource } from "../lightSource";
import { ZombieEnemy } from "./enemy/zombieEnemy";
import { EVENTS } from "../events";
import { DamageNumber } from "../particle/damageNumber";

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

export class Entity extends Drawable {
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
  protected lastX: number;
  protected lastY: number;
  protected hitBy: Player;
  protected crushX: number;
  protected crushY: number;
  protected crushVertical: boolean;
  protected crushed: boolean;
  protected rumbling: boolean;
  protected animationSpeed: number;
  protected drawYOffset: number;
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

  constructor(room: Room, game: Game, x: number, y: number) {
    super();

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
    this.drawMoveSpeed = 0.3;
    this.unconscious = false;
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
    room.entities.push(new this(room, game, x, y, ...rest));
  }

  addLightSource = (lightSource: LightSource) => {
    this.room.lightSources.push(lightSource);
  };

  removeLightSource = (lightSource: LightSource) => {
    this.room.lightSources = this.room.lightSources.filter(
      (ls) => ls !== lightSource,
    );
  };

  behavior = () => {};

  hit = (): number => {
    return 0;
  };

  hurtCallback = () => {};

  get type() {
    return EntityType.ENEMY;
  }
  /*
  playerKilledBy = (enemy: Entity) => {
    return enemy;
  };
*/
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
      color = "purple";
      outlineColor = "white";
    }
    this.room.particles.push(
      new DamageNumber(this.room, this.x, this.y, damage, color, outlineColor),
    );
  };

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX -= this.drawMoveSpeed * delta * this.drawX;
      this.drawY -= this.drawMoveSpeed * delta * this.drawY;

      this.drawX =
        Math.abs(this.drawX) < 0.01 ? 0 : Math.max(-1, Math.min(this.drawX, 1));
      this.drawY =
        Math.abs(this.drawY) < 0.01 ? 0 : Math.max(-1, Math.min(this.drawY, 1));
    }
  };

  setDrawXY = (x: number, y: number) => {
    this.drawX += this.x - x;
    this.drawY += this.y - y;
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
  /*
  readonly lastHitBy = (player: Player) => {
    this.hitBy = player;
    if (this.hitBy) this.game.pushMessage(`${this.hitBy}`);
    else this.game.pushMessage("Unknown");
  };
  */

  readonly hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();
    this.createDamageNumber(damage);
    this.health -= damage;
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  interact = (player: Player) => {};

  readonly dropLoot = () => {
    if (this.drop) {
      this.drop.level = this.room;
      if (!this.room.roomArray[this.x][this.y].isSolid()) {
        this.drop.x = this.x;
        this.drop.y = this.y;
      } else if (this.room.roomArray[this.x][this.y].isSolid()) {
        this.drop.x = this.lastX;
        this.drop.y = this.lastY;
      }
      this.room.items.push(this.drop);
      this.drop.onDrop();
    }
  };

  kill = () => {
    if (this.room.roomArray[this.x][this.y] instanceof Floor) {
      let b = new Bones(this.room, this.x, this.y);
      b.skin = this.room.roomArray[this.x][this.y].skin;
      this.room.roomArray[this.x][this.y] = b;
    }
    this.emitEnemyKilled();

    this.killNoBones();
  };

  killNoBones = () => {
    this.dead = true;
    /*GenericParticle.spawnCluster(
      this.room,
      this.x + 0.5,
      this.y + 0.5,
      this.deathParticleColor
    );
    this.room.particles.push(new DeathParticle(this.x, this.y));
*/
    this.dropLoot();
  };

  shadeAmount = () => {
    return this.room.softVis[this.x][this.y];
  };

  emitEnemyKilled = () => {
    globalEventBus.emit(EVENTS.ENEMY_KILLED, {
      enemyId: this.name,
    });
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

  facePlayer = (player: Player) => {
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    if (Math.abs(dx) === Math.abs(dy)) {
      // just moved, already facing player
    } else if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) this.direction = Direction.RIGHT;
      if (dx < 0) this.direction = Direction.LEFT;
    } else {
      if (dy > 0) this.direction = Direction.DOWN;
      if (dy < 0) this.direction = Direction.UP;
    }
  };

  draw = (delta: number) => {
    if (!this.dead) {
      if (this.hasShadow)
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
      Game.drawMob(
        this.tileX,
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
    /*if (this.crushed) {
      this.crushAnim(delta);
    }*/
  };

  tick = () => {
    this.behavior();
  };

  emitEntityData = (): void => {
    globalEventBus.emit("EntityData", {
      name: this.name,
      location: { x: this.x, y: this.y },
    });
  };

  drawTopLayer = (delta: number) => {
    this.updateDrawXY(delta);

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
        //console.log(`Path blocked at (${x}, ${y})`);
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
      for (let y = this.y - 2; y <= this.y + 2; y++) {
        if (this.room.vis[x][y]) {
          total += this.room.vis[x][y];
          count++;
        }
      }
    }
    return total / count;
  };

  makeHitWarnings = () => {
    const cullFactor = 0.25;
    const player: Player = this.getPlayer();
    const orthogonal = this.orthogonalAttack;
    const diagonal = this.diagonalAttack;
    const forwardOnly = this.forwardOnlyAttack;
    const direction = this.direction;
    const orthoRange = this.attackRange;
    const diagRange = this.diagonalAttackRange;

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
        distance: Utils.distance(dx, dy, player.x - this.x, player.y - this.y),
      }))
      .sort((a, b) => a.distance - b.distance);

    const keepCount = Math.ceil(warningCoordinates.length * (1 - cullFactor));
    const culledWarnings = warningCoordinates.slice(0, keepCount);

    culledWarnings.forEach(({ x, y }) => {
      const targetX = this.x + x;
      const targetY = this.y + y;
      if (this.isWithinRoomBounds(targetX, targetY)) {
        const hitWarning = new HitWarning(
          this.game,
          targetX,
          targetY,
          this.x,
          this.y,
          true,
          false,
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
