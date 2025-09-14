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
import { ImageParticle } from "../../particle/imageParticle";
import { DownLadder } from "../../tile/downLadder";
import { Door } from "../../tile/door";
import { Entity } from "../entity";

export class BigSkullEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  ticksSinceFirstHit: number;
  flashingFrame: number;
  targetPlayer: Player;
  aggro: boolean;
  unconscious: boolean;
  readonly REGEN_TICKS = 5;
  drops: Array<Item>;
  static difficulty: number = 4;
  static tileX: number = 21;
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
    this.tileX = 33;
    this.tileY = 12;
    this.seenPlayer = false;
    this.aggro = false;
    this.unconscious = false;
    this.ticksSinceFirstHit = 0;
    this.flashingFrame = 0;
    this.deathParticleColor = "#ffffff";
    this.chainPushable = false;
    this.name = "giant skeleton";
    this.dropChance = 1;
    this.drops = [];
    this.direction = Direction.DOWN;
    this.forwardOnlyAttack = true;

    this.drawMoveSpeed = 0.9;
    this.canDestroyOthers = true;
    if (drop) this.drops.push(drop);
    const dropAmount = Math.floor(Random.rand() * 3) + 2;
    while (this.drops.length < dropAmount && !this.cloned) {
      this.getDrop();
    }
  }

  hit = (): number => {
    return this.damage;
  };

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
    this.ticksSinceFirstHit = 0;
    if (this.health == 4) this.unconscious = false;
    this.health -= damage;
    this.maxHealth -= shieldHealth;
    this.startHurting();

    this.healthBar.hurt();
    this.createDamageNumber(damage, type);
    this.playHitSound();

    if (this.health == 2) {
      this.unconscious = true;
      ImageParticle.spawnCluster(this.room, this.x + 1, this.y + 1, 3, 28);
    } else {
      this.healthBar.hurt();
    }
    if (this.health <= 0) {
      ImageParticle.spawnCluster(this.room, this.x + 1, this.y + 1, 0, 24);
      this.kill();
    } else this.hurtCallback();
  };

  bleed = () => {};
  poison = () => {};

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        this.ticks++;
        return;
      }

      if (this.health <= 2) {
        this.unconscious = true;
        this.ticksSinceFirstHit++;
        if (this.ticksSinceFirstHit >= this.REGEN_TICKS) {
          this.healthBar.hurt();
          this.health = 4;
          this.unconscious = false;
        }
        this.ticks++;
        return;
      }

      this.ticks++;
      if (!this.seenPlayer) {
        this.lookForPlayer();
      } else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          let oldX = this.x;
          let oldY = this.y;

          // If aligned with the player on a row/column, turn toward the player instead of moving this turn
          const p = this.targetPlayer;
          const sharesRow = p.y >= this.y && p.y < this.y + this.h;
          const sharesColumn = p.x >= this.x && p.x < this.x + this.w;
          if (sharesRow !== sharesColumn) {
            let desiredDir = this.direction;
            if (sharesRow) {
              desiredDir = p.x < this.x ? Direction.LEFT : Direction.RIGHT;
            } else if (sharesColumn) {
              desiredDir = p.y < this.y ? Direction.UP : Direction.DOWN;
            }
            if (desiredDir !== this.direction) {
              this.direction = desiredDir;
              this.makeBigHitWarnings();
              this.ticks++;
              return;
            }
          }

          let disablePositions = Array<astar.Position>();
          for (const e of this.room.entities) {
            if (e !== this) {
              // For 2x2 enemy, block all tiles the entity occupies
              for (let ex = 0; ex < (e.w || 1); ex++) {
                for (let ey = 0; ey < (e.h || 1); ey++) {
                  disablePositions.push({
                    x: e.x + ex,
                    y: e.y + ey,
                  } as astar.Position);
                }
              }
            }
          }

          // Check for spike traps around the 2x2 area
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

          let grid = [];
          for (let x = 0; x < this.room.roomX + this.room.width; x++) {
            grid[x] = [];
            for (let y = 0; y < this.room.roomY + this.room.height; y++) {
              if (this.room.roomArray[x] && this.room.roomArray[x][y])
                grid[x][y] = this.room.roomArray[x][y];
              else grid[x][y] = false;
            }
          }

          let moves = astar.AStar.search(
            grid,
            this,
            this.targetPlayer,
            disablePositions,
            false,
            false,
            true,
            this.direction,
            undefined,
            undefined,
          );

          if (moves.length > 0) {
            let moveX = moves[0].pos.x;
            let moveY = moves[0].pos.y;
            let oldDir = this.direction;
            let player = this.targetPlayer;

            //this.facePlayer(player);

            if (moveX > oldX) this.direction = Direction.RIGHT;
            else if (moveX < oldX) this.direction = Direction.LEFT;
            else if (moveY > oldY) this.direction = Direction.DOWN;
            else if (moveY < oldY) this.direction = Direction.UP;

            if (oldDir === this.direction) {
              let hitPlayer = false;
              let wouldHit = (player: Player, moveX: number, moveY: number) => {
                return (
                  player.x >= moveX &&
                  player.x < moveX + this.w &&
                  player.y >= moveY &&
                  player.y < moveY + this.h
                );
              };

              for (const i in this.game.players) {
                const closestTile = this.closestTile(this.game.players[i]);
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  wouldHit(this.game.players[i], moveX, moveY)
                ) {
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX = 0.5 * (closestTile.x - this.game.players[i].x);
                  this.drawY = 0.5 * (closestTile.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  hitPlayer = true;
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
            }
          } else {
            this.facePlayer(this.targetPlayer);
          }

          // Add directional disable positions for forward-only attack
          if (this.direction == Direction.LEFT) {
            for (let i = 0; i < this.h; i++) {
              disablePositions.push({
                x: this.x,
                y: this.y + i + 1,
              } as astar.Position);
              disablePositions.push({
                x: this.x,
                y: this.y + i - 1,
              } as astar.Position);
            }
          }
          if (this.direction == Direction.RIGHT) {
            for (let i = 0; i < this.h; i++) {
              disablePositions.push({
                x: this.x + this.w - 1,
                y: this.y + i + 1,
              } as astar.Position);
              disablePositions.push({
                x: this.x + this.w - 1,
                y: this.y + i - 1,
              } as astar.Position);
            }
          }
          if (this.direction == Direction.DOWN) {
            for (let i = 0; i < this.w; i++) {
              disablePositions.push({
                x: this.x + i + 1,
                y: this.y + this.h - 1,
              } as astar.Position);
              disablePositions.push({
                x: this.x + i - 1,
                y: this.y + this.h - 1,
              } as astar.Position);
            }
          }
          if (this.direction == Direction.UP) {
            for (let i = 0; i < this.w; i++) {
              disablePositions.push({
                x: this.x + i + 1,
                y: this.y,
              } as astar.Position);
              disablePositions.push({
                x: this.x + i - 1,
                y: this.y,
              } as astar.Position);
            }
          }
          this.makeBigHitWarnings();
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
                this.makeBigHitWarnings();
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
      this.tileX = 33;
      this.tileY = 12;

      if (this.health <= 2 || this.cloned) {
        this.tileX = 35;
        this.tileY = 12;
        if (this.ticksSinceFirstHit >= 3) {
          this.flashingFrame += 0.1 * delta;
          if (Math.floor(this.flashingFrame) % 2 === 0) {
            this.tileX = 33;
          }
        }
      }

      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX,
        this.tileY + this.direction * 3,
        2,
        3,
        this.x - this.drawX,
        this.y - 1.5 - this.drawY - this.jumpY,
        2,
        3,
        this.softShadeColor,
        this.shadeAmount(),
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
      this.y - 0.5,
      true,
    );
  };
}
