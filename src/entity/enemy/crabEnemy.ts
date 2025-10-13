import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Utils } from "../../utility/utils";

export class CrabEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 1;
  static tileX: number = 8;
  static tileY: number = 4;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 8;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "crab";
    this.orthogonalAttack = true;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    this.baseDamage = 0.5;
    //if (drop) this.drop = drop;
    this.drawYOffset = 0.25;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Crab 
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return this.damage;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
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
            const moves = this.searchPathLocalized(
              this.target as any,
              disablePositions,
              { useLastPlayerPos: true, allowOmni: true },
            );
            if (moves.length > 0) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moves[0].pos.x &&
                  this.game.players[i].y === moves[0].pos.y
                ) {
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX = 0.5 * (this.x - this.game.players[i].x);
                  this.drawY = 0.5 * (this.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  hitPlayer = true;
                }
              }

              if (!hitPlayer) {
                this.tryMove(moves[0].pos.x, moves[0].pos.y);
                this.setDrawXY(oldX, oldY);
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
              }
            }
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
              this.makeHitWarnings();
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
                    this.makeHitWarnings();
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.ticks % 2 === 0) {
        this.tileX = 9;
        this.tileY = 4;
      } else {
        this.tileX = 8;
        this.tileY = 4;
      }
      let rumbleX = this.rumble(this.rumbling, this.frame, this.direction).x;
      let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX,
        this.tileY + this.direction,
        1,
        1,
        this.x - this.drawX + rumbleX,
        this.y - this.drawYOffset - this.drawY + rumbleY,
        1 * this.crushX,
        1 * this.crushY,
        this.softShadeColor,
        this.shadeAmount(),
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
      if (this.crushed) {
        this.crushAnim(delta);
      }
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
    }
    Game.ctx.restore();
  };
}
