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
  entityType: EntityType;
  hitBy: Player;

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
    this.entityType = EntityType.ENEMY;
    this.hitBy = this.getPlayer();
  }

  tryMove = (x: number, y: number) => {
    let pointWouldBeIn = (someX: number, someY: number): boolean => {
      return (
        someX >= x && someX < x + this.w && someY >= y && someY < y + this.h
      );
    };
    let entityCollide = (entity: Entity): boolean => {
      if (entity.x >= x + this.w || entity.x + entity.w <= x) return false;
      if (entity.y >= y + this.h || entity.y + entity.h <= y) return false;
      return true;
    };
    for (const e of this.room.entities) {
      if (e !== this && entityCollide(e)) {
        return;
      }
    }
    for (const i in this.game.players) {
      if (pointWouldBeIn(this.game.players[i].x, this.game.players[i].y)) {
        return;
      }
    }
    let tiles = [];
    for (let xx = 0; xx < this.w; xx++) {
      for (let yy = 0; yy < this.h; yy++) {
        if (!this.room.roomArray[x + xx][y + yy].isSolid()) {
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
  };

  hit = (): number => {
    return 0;
  };

  hurtCallback = () => {};

  isType = () => {};

  playerKilledBy = (enemy: Entity) => {
    return enemy;
  };

  pointIn = (x: number, y: number): boolean => {
    return (
      x >= this.x && x < this.x + this.w && y >= this.y && y < this.y + this.h
    );
  };

  getPlayer = () => {
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

  lastHitBy = (player: Player) => {
    this.hitBy = player;
    this.game.pushMessage(`${this.hitBy}`);
  };

  hurt = (playerHitBy: Player, damage: number) => {
    this.healthBar.hurt();

    this.health -= damage;
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  interact = (player: Player) => {};

  dropLoot = () => {
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
        this.y - 1.5 - this.drawY,
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
    this.drawX += -0.5 * this.drawX;
    this.drawY += -0.5 * this.drawY;
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
  /*crush = () => {
    let player: Player;
    for (let i in this.game.players) {
      player = this.game.players[i];
    }
    if (this.x == player.x) {
      this.crushVertical = true;
    }
    if (this.y == player.y) {
      this.crushVertical = false;
    }
  };
  crushAnim = (delta: number) => {
    if (this.crushVertical && this.crushX >= 0) {
      this.crushX -= delta * 0.125;
    } else if (this.crushY >= 0) {
      this.crushY -= delta * 0.125;
    }
  };
*/
  makeHitWarnings = (
    orthogonal: Boolean,
    diagonal: Boolean,
    forwardOnly: Boolean,
    direction: EntityDirection
  ) => {
    if (orthogonal && !forwardOnly) {
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x - 1, this.y, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x + 1, this.y, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x, this.y - 1, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x, this.y + 1, this.x, this.y)
      );
    }
    if (diagonal && !forwardOnly) {
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x - 1, this.y - 1, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x + 1, this.y + 1, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x + 1, this.y - 1, this.x, this.y)
      );
      this.room.hitwarnings.push(
        new HitWarning(this.game, this.x - 1, this.y + 1, this.x, this.y)
      );
    }
    if (forwardOnly) {
      if (direction == EntityDirection.LEFT) {
        this.room.hitwarnings.push(
          new HitWarning(this.game, this.x - 1, this.y, this.x, this.y)
        );
      }
      if (direction == EntityDirection.RIGHT) {
        this.room.hitwarnings.push(
          new HitWarning(this.game, this.x + 1, this.y, this.x, this.y)
        );
      }
      if (direction == EntityDirection.UP) {
        this.room.hitwarnings.push(
          new HitWarning(this.game, this.x, this.y - 1, this.x, this.y)
        );
      }
      if (direction == EntityDirection.DOWN) {
        this.room.hitwarnings.push(
          new HitWarning(this.game, this.x, this.y + 1, this.x, this.y)
        );
      }
    }
  };
}
