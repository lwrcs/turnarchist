import { Direction, Game } from "../../game";
import { Room } from "../../room";
import { Player } from "../../player";
import { HitWarning } from "../../hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../weapon/spear";
import { GameConstants } from "../../gameConstants";
import { DeathParticle } from "../../particle/deathParticle";
import { Enemy } from "./enemy";
import { Random } from "../../random";

export class BigSkullEnemy extends Enemy {
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

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.w = 2;
    this.h = 2;
    this.ticks = 0;
    this.frame = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.tileX = 21;
    this.tileY = 0;
    this.seenPlayer = false;
    this.aggro = false;
    this.ticksSinceFirstHit = 0;
    this.flashingFrame = 0;
    this.deathParticleColor = "#ffffff";
    this.chainPushable = false;
    this.name = "giant skeleton";

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

  addHitWarnings = () => {
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x - 1, this.y, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x - 1, this.y + 1, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x + 2, this.y, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x + 2, this.y + 1, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x, this.y - 1, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x + 1, this.y - 1, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x, this.y + 2, this.x, this.y),
    );
    this.room.hitwarnings.push(
      new HitWarning(this.game, this.x + 1, this.y + 2, this.x, this.y),
    );
  };

  hit = (): number => {
    return 1;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      if (this.health <= 2) {
        this.ticksSinceFirstHit++;
        if (this.ticksSinceFirstHit >= this.REGEN_TICKS) {
          this.health++;
          this.ticksSinceFirstHit = 0;
        }
        this.ticks++;
      } else {
        this.ticks++;
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
              if (this.health >= 3) this.addHitWarnings();
            }
          }
        } else if (this.seenPlayer) {
          if (this.room.playerTicked === this.targetPlayer) {
            this.alertTicks = Math.max(0, this.alertTicks - 1);
            let oldX = this.x;
            let oldY = this.y;
            let moveX = this.x;
            let moveY = this.y;
            if (this.ticks % 2 === 0) {
              // horizontal preference
              if (this.targetPlayer.x >= this.x + this.w) moveX++;
              else if (this.targetPlayer.x < this.x) moveX--;
              else if (this.targetPlayer.y >= this.y + this.h) moveY++;
              else if (this.targetPlayer.y < this.y) moveY--;
            } else {
              // vertical preference
              if (this.targetPlayer.y >= this.y + this.h) moveY++;
              else if (this.targetPlayer.y < this.y) moveY--;
              else if (this.targetPlayer.x >= this.x + this.w) moveX++;
              else if (this.targetPlayer.x < this.x) moveX--;
            }

            let hitPlayer = false;
            if (this.health >= 2.5) {
              let wouldHit = (player: Player, moveX: number, moveY: number) => {
                return (
                  player.x >= moveX &&
                  player.x < moveX + this.w &&
                  player.y >= moveY &&
                  player.y < moveY + this.h
                );
              };
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  wouldHit(this.game.players[i], moveX, moveY)
                ) {
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX = 0.5 * (this.x - this.game.players[i].x);
                  this.drawY = 0.5 * (this.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                }
              }
            }
            if (!hitPlayer) {
              this.tryMove(moveX, moveY);
              this.drawX = this.x - oldX;
              this.drawY = this.y - oldY;
              if (this.x > oldX) this.direction = Direction.RIGHT;
              else if (this.x < oldX) this.direction = Direction.LEFT;
              else if (this.y > oldY) this.direction = Direction.DOWN;
              else if (this.y < oldY) this.direction = Direction.UP;
            }

            if (this.health < this.maxHealth) {
              this.ticksSinceFirstHit++;
              if (this.ticksSinceFirstHit >= this.REGEN_TICKS) {
                this.health++;
                this.ticksSinceFirstHit = 0;
              }
            }

            if (this.health >= 2.5) this.addHitWarnings();
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
                  if (this.health >= 3) this.addHitWarnings();
                }
              }
            }
          }
        }
      }
    }
  };

  draw = (delta: number) => {
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.tileX = 21;
      this.tileY = 0;
      if (this.health === 3) {
        this.tileX = 21;
        this.tileY = 4;
        if (this.ticksSinceFirstHit >= 3) {
          this.flashingFrame += 0.1 * delta;
          if (Math.floor(this.flashingFrame) % 2 === 0) {
            this.tileY = 0;
          }
        }
      } else if (this.health === 2) {
        this.tileX = 21;
        this.tileY = 8;
        if (this.ticksSinceFirstHit >= 3) {
          this.flashingFrame += 0.1 * delta;
          if (Math.floor(this.flashingFrame) % 2 === 0) {
            this.tileY = 4;
          }
        }
      } else if (this.health === 1) {
        this.tileX = 21;
        this.tileY = 12;
        if (this.ticksSinceFirstHit >= 3) {
          this.flashingFrame += 0.1 * delta;
          if (Math.floor(this.flashingFrame) % 2 === 0) {
            this.tileY = 8;
          }
        }
      }

      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow)
        Game.drawMob(
          18,
          0,
          2,
          2,
          this.x - this.drawX,
          this.y - this.drawY,
          2,
          2,
          this.room.shadeColor,
          this.shadeAmount(),
        );
      Game.drawMob(
        this.tileX + (this.tileX === 20 ? Math.floor(this.frame) * 2 : 0),
        this.tileY,
        2,
        4,
        this.x - this.drawX,
        this.y - 2.5 - this.drawY,
        2,
        4,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    }
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

  dropLoot = () => {
    let dropOffsets = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ];
    for (let i = 0; i < this.drops.length; i++) {
      this.drops[i].level = this.room;
      this.drops[i].x = this.x + dropOffsets[i].x;
      this.drops[i].y = this.y + dropOffsets[i].y;
      this.room.items.push(this.drops[i]);
    }
  };
}
