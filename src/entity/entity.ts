import { Game } from "../game";
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

export class Entity extends Drawable {
  room: Room;
  x: number;
  y: number;
  w: number;
  h: number;
  direction: EntityDirection;
  drawX: number;
  drawY: number;
  dead: boolean;
  game: Game;
  health: number;
  maxHealth: number;
  tileX: number;
  tileY: number;
  hasShadow: boolean;
  skipNextTurns: number;
  //TODO: change these to functions? for enemies that switch states
  destroyable: boolean; // can the player destroy this enemy?
  pushable: boolean; // can the player push this enemy? (true for crates/barrels, false for regular mobs)
  chainPushable: boolean; // can the player pushing another enemy push this enemy? (default true)
  interactable: boolean; // can the player interact
  deathParticleColor: string;
  healthBar: HealthBar;
  drop: Item;
  sleepingZFrame = 0;
  alertTicks: number;
  exclamationFrame: number;
  lastX: number;
  lastY: number;
  hitBy: Player;
  crushX: number;
  crushY: number;
  crushVertical: boolean;
  crushed: boolean;
  rumbling: boolean;
  animationSpeed: number;
  drawYOffset: number;
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
    this.direction = EntityDirection.DOWN;
    this.destroyable = true;
    this.pushable = false;
    this.chainPushable = true;
    this.interactable = false;
    this.healthBar = new HealthBar();
    this.alertTicks = 0;
    this.exclamationFrame = 0;
    this.lastX = x;
    this.lastY = y;
    this.hitBy = this.getPlayer();
    this.crushX = 1;
    this.crushY = 1;
    this.crushVertical = false;
    this.crushed = false;
    this.rumbling = false;
    this.animationSpeed = 0.1;
    this.drawYOffset = 1.175;
  }

  hit = (): number => {
    return 0;
  };

  hurtCallback = () => {};

  get type() {
    return EntityType.ENEMY;
  }

  playerKilledBy = (enemy: Entity) => {
    return enemy;
  };

  pointIn = (x: number, y: number): boolean => {
    return (
      x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
    );
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

  readonly lastHitBy = (player: Player) => {
    this.hitBy = player;
    this.game.pushMessage(`${this.hitBy}`);
  };

  readonly hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();

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
      if (dx > 0) this.direction = EntityDirection.RIGHT;
      if (dx < 0) this.direction = EntityDirection.LEFT;
    } else {
      if (dy > 0) this.direction = EntityDirection.DOWN;
      if (dy < 0) this.direction = EntityDirection.UP;
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
          this.shadeAmount()
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
        this.shadeAmount()
      );
    }
    /*if (this.crushed) {
      this.crushAnim(delta);
    }*/
  };

  tick = () => {};

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y - this.drawY;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true
    );
    this.drawX += -0.3 * this.drawX;
    this.drawY += -0.3 * this.drawY;
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
        "white"
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
        GameConstants.WARNING_RED
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
  rumble = (rumbling: boolean, frame: number, direction?: EntityDirection) => {
    let rumbleOffset = { x: 0, y: 0 };

    if (rumbling) {
      const isOddFrame = Math.floor(frame) % 2 === 1;
      const offset = isOddFrame ? 0.0325 : 0;

      if (
        direction === EntityDirection.LEFT ||
        direction === EntityDirection.RIGHT
      ) {
        rumbleOffset.y = offset;
      } else if (
        direction === EntityDirection.UP ||
        direction === EntityDirection.DOWN ||
        !direction
      ) {
        rumbleOffset.x = offset;
      }
      this.animationSpeed = 0.2;
    }
    return rumbleOffset;
  };

  get crushXoffset() {
    return this.crushX;
  }

  get crushYoffset() {
    return this.crushY;
  }

  attemptProjectilePlacement = (
    offsets: { x: number; y: number }[],
    projectileClass: new (parent: Entity, x: number, y: number) => Projectile,
    collide: boolean = false,
    clearPath: boolean = true,
    targetingPlayer: boolean = false
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
    clearPath: boolean
  ): boolean => {
    if (!this.isWithinRoomBounds(x, y)) return false;
    if (clearPath && !this.isPathClear(this.x, this.y, x, y)) return false;
    if (collide && this.isEntityColliding(x, y)) return false;

    const targetTile = this.room.roomArray[x][y];
    return targetTile && !targetTile.isSolid() && !targetTile.isDoor;
  };

  private isEntityColliding = (x: number, y: number): boolean => {
    return this.room.entities.some(
      (entity) => entity.x === x && entity.y === y
    );
  };

  private placeProjectile = (
    projectileClass: new (parent: Entity, x: number, y: number) => Projectile,
    x: number,
    y: number
  ) => {
    this.room.projectiles.push(new projectileClass(this, x, y));
  };

  isPathClear = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
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
        console.log(`Path blocked at (${x}, ${y})`);
        return false;
      }
    }

    console.log(`Path to (${endX}, ${endY}) is clear`);
    return true;
  };

  calculateProjectileOffsets(
    targetX: number,
    targetY: number,
    attackLength: number
  ): { x: number; y: number }[] {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    let offsets = [];

    console.log(
      `Calculating offsets: dx=${dx}, dy=${dy}, attackLength=${attackLength}`
    );
    console.log(
      `Current position: (${this.x}, ${this.y}), Target: (${targetX}, ${targetY})`
    );

    // Normalize the direction
    const stepX = dx !== 0 ? Math.sign(dx) : 0;
    const stepY = dy !== 0 ? Math.sign(dy) : 0;

    // Generate offsets for the full attackLength
    for (let i = 1; i <= attackLength; i++) {
      offsets.push({ x: i * stepX, y: i * stepY });
    }

    console.log("Calculated offsets:", offsets);
    return offsets;
  }

  makeHitWarnings = (
    orthogonal: boolean,
    diagonal: boolean,
    forwardOnly: boolean,
    direction: EntityDirection,
    orthoRange: number = 1,
    diagRange: number = 1
  ) => {
    const addWarning = (dx: number, dy: number) => {
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x + dx, this.y + dy, this.x, this.y)
      );
    };

    const generateOffsets = (baseOffsets: number[][], range: number) => {
      let extendedOffsets: number[][] = [];
      for (let i = 1; i <= range; i++) {
        baseOffsets.forEach(([dx, dy]) => {
          extendedOffsets.push([dx * i, dy * i]);
        });
      }
      return extendedOffsets;
    };

    const orthogonalOffsets = generateOffsets(
      [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ],
      orthoRange
    );
    const diagonalOffsets = generateOffsets(
      [
        [-1, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
      ],
      diagRange
    );

    const directionOffsets = {
      [EntityDirection.LEFT]: [-1, 0],
      [EntityDirection.RIGHT]: [1, 0],
      [EntityDirection.UP]: [0, -1],
      [EntityDirection.DOWN]: [0, 1],
    };

    if (!forwardOnly) {
      if (orthogonal) {
        orthogonalOffsets.forEach(([dx, dy]) => addWarning(dx, dy));
      }
      if (diagonal) {
        diagonalOffsets.forEach(([dx, dy]) => addWarning(dx, dy));
      }
    } else {
      const [dx, dy] = directionOffsets[direction];
      for (let i = 1; i <= orthoRange; i++) {
        addWarning(dx * i, dy * i);
      }
    }
  };

  isWithinRoomBounds = (x: number, y: number): boolean => {
    const xInBounds =
      x >= this.room.roomX && x < this.room.roomX + this.room.width;
    const yInBounds =
      y >= this.room.roomY && y < this.room.roomY + this.room.height;
    const tileExists =
      this.room.roomArray[x] && this.room.roomArray[x][y] !== undefined;

    console.log(
      `Checking bounds for (${x}, ${y}):`,
      `xInBounds: ${xInBounds},`,
      `yInBounds: ${yInBounds},`,
      `tileExists: ${tileExists}`
    );

    return xInBounds && yInBounds && tileExists;
  };
}
