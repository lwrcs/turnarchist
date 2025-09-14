import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Entity } from "../entity";
import { Utils } from "../../utility/utils";
import { Door } from "../../tile/door";
import { DownLadder } from "../../tile/downLadder";
import { Sound } from "../../sound/sound";
import { HitWarning } from "../../drawable/hitWarning";

export class CrusherEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 1;
  static tileX: number = 8;
  static tileY: number = 4;
  animateY: number = 0;
  softAnimateY: number = 0;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 3;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "crusher";
    this.orthogonalAttack = true;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    //if (drop) this.drop = drop;
    this.drawYOffset = 2.5;
    this.shouldDrawAbovePlayer = true;
    this.collidable = false;
    this.destroyable = false;

    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Crab 
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return 1;
  };

  applyShield = () => {};
  applyBuff = () => {};

  // Allow crushers to move onto a player's tile
  readonly tryMove = (x: number, y: number, collide: boolean = true) => {
    const entityCollide = (entity: Entity): boolean => {
      if (entity.x >= x + this.w || entity.x + entity.w <= x) return false;
      if (entity.y >= y + this.h || entity.y + entity.h <= y) return false;
      return true;
    };

    // Keep collisions with other entities unless disabled
    for (const e of this.room.entities) {
      if (e !== this && entityCollide(e) && collide) {
        return;
      }
    }

    // DIFFERENCE from base: do NOT block moving into players
    // (crushers can overlap players to crush them)

    const tiles = [] as any[];
    for (let xx = 0; xx < this.w; xx++) {
      for (let yy = 0; yy < this.h; yy++) {
        const targetTile = this.room.roomArray[x + xx][y + yy];
        if (
          targetTile &&
          !targetTile.isSolid() &&
          !(targetTile instanceof Door) &&
          !(targetTile instanceof DownLadder)
        ) {
          tiles.push(targetTile);
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

  tryCrush = () => {
    let flag = false;
    for (const i in this.game.players) {
      const p = this.game.players[i];
      if (
        this.game.rooms[p.levelID] === this.room &&
        p.x === this.x &&
        p.y === this.y
      ) {
        p.hurt(this.hit(), this.name, 400);
        this.drawX += 0.5 * (this.x - p.x);
        this.drawY += 0.5 * (this.y - p.y);
        if (p === this.game.players[this.game.localPlayerID]) {
          //this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
          //this.animateCrush();
        }
        flag = true;
      }
    }
    return flag;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          this.ticks++;
          if (this.ticks % 2 === 1) {
            this.rumbling = true;
            let oldX = this.x;
            let oldY = this.y;
            let disablePositions = Array<astar.Position>();

            for (const e of this.room.entities) {
              if (e !== this) {
                disablePositions.push({ x: e.x, y: e.y } as astar.Position);
              }
            }

            for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
              for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
                if (
                  this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                  (this.room.roomArray[xx][yy] as SpikeTrap).on
                ) {
                  // don't walk on active spiketraps
                  disablePositions.push({ x: xx, y: yy } as astar.Position);
                }
              }
            }

            let grid = [];
            for (let x = 0; x < this.room.roomX + this.room.width; x++) {
              grid[x] = [];
              for (let y = 0; y < this.room.roomY + this.room.height; y++) {
                if (this.room.roomArray[x] && this.room.roomArray[x][y])
                  grid[x][y] = this.room.roomArray[x][y];
                else grid[x][y] = false;
              }
            }
            this.target =
              this.getAverageLuminance() > 0 // 0.8
                ? this.targetPlayer
                : this.room.getExtremeLuminanceFromPoint(this.x, this.y)
                    .darkest;
            let moves = astar.AStar.search(
              grid,
              this,
              this.target,
              disablePositions,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              this.lastPlayerPos,
            );
            if (moves.length > 0) {
              this.tryMove(moves[0].pos.x, moves[0].pos.y);
              this.setDrawXY(oldX, oldY);
              if (this.x > oldX) this.direction = Direction.RIGHT;
              else if (this.x < oldX) this.direction = Direction.LEFT;
              else if (this.y > oldY) this.direction = Direction.DOWN;
              else if (this.y < oldY) this.direction = Direction.UP;

              // If we ended up overlapping a player after moving, crush immediately
              const crushed = this.tryCrush();
              this.animateCrush();
              //if (crushed) this.ticks++;

              this.animateCrush();
            } else {
              const crushed = this.tryCrush();
              //if (crushed) this.animateCrush();
              //if (crushed) this.ticks++;

              this.animateCrush();
              //if (crushed) this.makeHitWarnings();
            }

            this.makeHitWarning();

            this.rumbling = false;
          } else {
            this.rumbling = true;
            /*
            if (
              (this.target.x === this.targetPlayer.x &&
                this.target.y === this.targetPlayer.y) ||
              Utils.distance(
                this.targetPlayer.x,
                this.targetPlayer.y,
                this.x,
                this.y,
              ) <= 2
            )
              */ {
              // Only attack when stationary: if overlapping the player now, crush them

              this.makeHitWarnings();
              this.makeHitWarning();
            }
          }
        }

        let targetPlayerOffline =
          Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !==
          -1;
        if (!this.aggro || targetPlayerOffline) {
          let p = this.nearestPlayer();
          if (p !== false) {
            let [distance, player] = p;
            if (
              distance <= 4 &&
              (targetPlayerOffline ||
                distance < this.playerDistance(this.targetPlayer))
            ) {
              if (player !== this.targetPlayer) {
                this.targetPlayer = player;
                this.facePlayer(player);
                if (player === this.game.players[this.game.localPlayerID])
                  this.alertTicks = 1;
                if (this.ticks % 2 === 0) {
                  /*
                  if (
                    (this.target.x === this.targetPlayer.x &&
                      this.target.y === this.targetPlayer.y) ||
                    Utils.distance(
                      this.targetPlayer.x,
                      this.targetPlayer.y,
                      this.x,
                      this.y,
                    ) <= 2
                  ) */ {
                    //this.makeHitWarnings();
                  }
                }
              }
            }
          }
        }
      }
      this.makeHitWarning();
    }
  };

  makeHitWarning = () => {
    this.room.hitwarnings.push(
      new HitWarning(
        this.room.game,
        this.x,
        this.y,
        this.x - 1,
        this.y - 1,
        false,
        false,
      ),
    );
  };

  animateCrush = () => {
    this.animateY = -1;
    setTimeout(() => {
      this.animateY = 3;
      Sound.playCrush();
      setTimeout(() => {
        this.game.shakeScreen(2 * this.x, 2 * this.y, true);
      }, 100);
      setTimeout(() => {
        this.animateY = 0;
      }, 500);
    }, 150);
  };

  updateAnimateY = (delta: number) => {
    const diff = this.animateY - this.softAnimateY;
    if (diff > 0.001) {
      this.softAnimateY = this.softAnimateY + diff * 0.2 * delta;
    } else if (diff < -0.001) {
      this.softAnimateY = this.softAnimateY + diff * 0.2 * delta;
    } else {
      this.softAnimateY = this.animateY;
    }
    if (this.softAnimateY > 1.25) {
      this.softAnimateY = 1.25;
    }
  };

  draw = (delta: number) => {
    this.drawableY = this.y + 0.1;
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);
      this.updateAnimateY(delta);

      let rumbleX = this.rumble(this.rumbling, this.frame, this.direction).x;
      let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      if (this.hasShadow) this.drawShadow(delta);
      Game.drawObj(
        this.tileX,
        this.tileY,
        2,
        2,
        this.x - this.drawX + rumbleX - 0.5,
        this.y - this.drawYOffset - this.drawY + rumbleY + this.softAnimateY,
        2 * this.crushX,
        2 * this.crushY,
        this.softShadeColor,
        this.shadeAmount(),
      );
      if (this.crushed) {
        this.crushAnim(delta);
      }
    }

    Game.ctx.restore();
  };
}
