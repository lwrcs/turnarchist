import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { HitWarning } from "../../drawable/hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/resource/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../item/weapon/spear";
import { GameConstants } from "../../game/gameConstants";
import { DeathParticle } from "../../particle/deathParticle";
import { Enemy } from "./enemy";
import { Random } from "../../utility/random";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";

export class BigKnightEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  ticksSinceFirstHit: number;
  flashingFrame: number;
  targetPlayer: Player;
  aggro: boolean;
  readonly REGEN_TICKS = 5;
  drops: Array<Item>;
  static difficulty: number = 4;
  static tileX: number = 29;
  static tileY: number = 0;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.w = 2;
    this.h = 2;
    this.ticks = 0;
    this.frame = 0;
    this.health = 6;
    this.maxHealth = 6;
    this.defaultMaxHealth = 6;
    this.tileX = 29;
    this.tileY = 0;
    this.seenPlayer = false;
    this.aggro = false;
    this.ticksSinceFirstHit = 0;
    this.flashingFrame = 0;
    this.deathParticleColor = "#ffffff";
    this.chainPushable = false;
    this.name = "giant knight";
    this.orthogonalAttack = true;

    this.drops = [];
    if (drop) this.drops.push(drop);
    while (this.drops.length < 4) {
      let dropProb = Random.rand();
      if (dropProb < 0.005)
        this.drops.push(new Spear(this.room, this.x, this.y));
      else if (dropProb < 0.04)
        this.drops.push(new RedGem(this.room, this.x, this.y));
      else if (dropProb < 0.075)
        this.drops.push(new RedGem(this.room, this.x, this.y));
      else if (dropProb < 0.1)
        this.drops.push(new RedGem(this.room, this.x, this.y));
      else this.drops.push(new Coin(this.room, this.x, this.y));
    }
  }

  hit = (): number => {
    return this.damage;
  };

  bleed = () => {};
  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (this.health === 1) {
        this.ticksSinceFirstHit++;
        if (this.ticksSinceFirstHit >= this.REGEN_TICKS) {
          this.health++;
          this.ticksSinceFirstHit = 0;
        }
      } else {
        if (!this.seenPlayer) {
          let p = this.nearestPlayer();
          if (p !== false) {
            let [distance, player] = p;
            if (distance <= 4) {
              this.targetPlayer = player;
              this.facePlayer(player);
              this.seenPlayer = true;
              if (player === this.game.players[this.game.localPlayerID])
                this.alertTicks = 1;
              this.makeBigHitWarnings();
            }
          }
        } else if (this.seenPlayer) {
          if (this.room.playerTicked === this.targetPlayer) {
            this.alertTicks = Math.max(0, this.alertTicks - 1);
            this.ticks++;

            // Knight cadence: warn on even ticks, move on odd ticks
            if (this.ticks % 2 === 0) {
              this.rumbling = true;
              this.makeBigHitWarnings();
              return;
            }

            const oldX = this.x;
            const oldY = this.y;

            // Build disabled positions (entities and active spike traps)
            let disablePositions = Array<astar.Position>();
            for (const e of this.room.entities) {
              if (e !== this) {
                for (let dx = 0; dx < e.w; dx++) {
                  for (let dy = 0; dy < e.h; dy++) {
                    disablePositions.push({
                      x: e.x + dx,
                      y: e.y + dy,
                    } as astar.Position);
                  }
                }
              }
            }
            for (let xx = this.x - 1; xx <= this.x + this.w; xx++) {
              for (let yy = this.y - 1; yy <= this.y + this.h; yy++) {
                if (
                  this.room.roomArray[xx] &&
                  this.room.roomArray[xx][yy] &&
                  this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                  (this.room.roomArray[xx][yy] as SpikeTrap).on
                ) {
                  disablePositions.push({ x: xx, y: yy } as astar.Position);
                }
              }
            }

            // Localized A* pathfinding like BigZombieEnemy
            const moves = this.searchPathLocalized(
              this.targetPlayer,
              disablePositions,
            );

            if (moves.length > 0) {
              const moveX = moves[0].pos.x;
              const moveY = moves[0].pos.y;
              if (moveX > oldX) this.direction = Direction.RIGHT;
              else if (moveX < oldX) this.direction = Direction.LEFT;
              else if (moveY > oldY) this.direction = Direction.DOWN;
              else if (moveY < oldY) this.direction = Direction.UP;
              let hitPlayer = false;
              if (this.health >= 3) {
                for (const i in this.game.players) {
                  if (
                    this.game.rooms[this.game.players[i].levelID] === this.room
                  ) {
                    let playerHit = false;
                    for (let dx = 0; dx < this.w; dx++) {
                      for (let dy = 0; dy < this.h; dy++) {
                        if (
                          this.game.players[i].x === moveX + dx &&
                          this.game.players[i].y === moveY + dy
                        ) {
                          playerHit = true;
                          break;
                        }
                      }
                      if (playerHit) break;
                    }
                    if (playerHit) {
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
                }
              }
              if (!hitPlayer) {
                this.tryMove(moveX, moveY);
                this.setDrawXY(oldX, oldY);
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
              }
            } else {
              this.facePlayer(this.targetPlayer);
            }

            // Handle regeneration while damaged
            if (this.health < this.maxHealth) {
              this.ticksSinceFirstHit++;
              if (this.ticksSinceFirstHit >= this.REGEN_TICKS) {
                this.health++;
                this.ticksSinceFirstHit = 0;
              }
            }
          }

          let targetPlayerOffline =
            Object.values(this.game.offlinePlayers).indexOf(
              this.targetPlayer,
            ) !== -1;
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
                  if (this.health >= 3 && this.ticks % 2 === 0)
                    this.rumbling = true;
                  this.makeBigHitWarnings();
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
      let rumbleX = this.rumble(this.rumbling, this.frame).x;
      let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      const tileX =
        this.ticks % 2 === 0
          ? 2 * Math.floor((this.tileX + this.frame) / 2) + 1
          : this.tileX;
      const tileY = this.ticks % 2 === 0 ? this.tileY : this.tileY + 4;
      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        tileX,
        tileY,
        2,
        4,
        this.x - this.drawX + rumbleX,
        this.y - 2.5 - this.drawY,
        2,
        4,
        this.softShadeColor,
        this.shadeAmount(),
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );

      if (!this.cloned) {
        if (!this.seenPlayer) {
          this.drawSleepingZs(
            delta,
            GameConstants.TILESIZE * 0.5,
            GameConstants.TILESIZE * -1,
          );
        }
        if (this.alertTicks > 0) {
          this.drawExclamation(
            delta,
            GameConstants.TILESIZE * 0.5,
            GameConstants.TILESIZE * -1,
          );
        }
      }
    }
    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x + 0.5,
      this.y,
      true,
    );
  };
}
