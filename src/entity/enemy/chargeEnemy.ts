import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { HitWarning } from "../../drawable/hitWarning";
import { Door } from "../../tile/door";
import { GenericParticle } from "../../particle/genericParticle";
import { GameConstants } from "../../game/gameConstants";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";

export enum ChargeEnemyState {
  IDLE,
  ALERTED,
  CHARGING,
}

export class ChargeEnemy extends Enemy {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  visualTargetX: number;
  visualTargetY: number;
  ticks: number;
  frame: number;
  state: ChargeEnemyState;
  trailFrame: number;
  drop: Item;
  maxChargeDistance: number = 3;
  static difficulty: number = 5;
  static tileX: number = 13;
  static tileY: number = 8;
  trailAlpha: number = 1;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 13;
    this.tileY = 8;
    this.trailFrame = 0;
    this.alertTicks = 0;
    this.deathParticleColor = "#ffffff";
    this.lastX = this.x;
    this.lastY = this.y;
    this.name = "charge knight";

    this.state = ChargeEnemyState.IDLE;
    if (drop) this.drop = drop;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return this.damage;
  };

  canMoveOver = (x: number, y: number): boolean => {
    for (const e of this.room.entities) {
      if (e !== this && x === e.x && y === e.y) return false;
    }
    let t = this.room.roomArray[x][y];
    return !(t.isSolid() || t instanceof Door);
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.handleSkipTurns()) return;

      this.ticks++;
      if (this.state === ChargeEnemyState.IDLE) {
        let blocked = false;
        let dx = 0;
        let dy = 0;
        for (const i in this.game.players) {
          // Check if player is within detection range (maxChargeDistance)
          const playerX = this.game.players[i].x;
          const playerY = this.game.players[i].y;
          const distanceX = Math.abs(this.x - playerX);
          const distanceY = Math.abs(this.y - playerY);

          // Only detect players in straight lines and within maxChargeDistance
          if (
            (this.x === playerX && distanceY <= this.maxChargeDistance) ||
            (this.y === playerY && distanceX <= this.maxChargeDistance)
          ) {
            if (this.x === playerX) {
              if (this.y < playerY) dy = 1;
              else dy = -1;
              for (let yy = this.y; yy !== playerY; yy += dy) {
                if (!this.canMoveOver(this.x, yy)) blocked = true;
              }
            } else if (this.y === playerY) {
              if (this.x < playerX) dx = 1;
              else dx = -1;
              for (let xx = this.x; xx !== playerX; xx += dx) {
                if (!this.canMoveOver(xx, this.y)) blocked = true;
              }
            }

            if ((dx !== 0 || dy !== 0) && !blocked) {
              this.state = ChargeEnemyState.ALERTED;
              this.targetX = this.x;
              this.targetY = this.y;
              let distanceMoved = 0;
              while (
                this.canMoveOver(this.targetX + dx, this.targetY + dy) &&
                distanceMoved < this.maxChargeDistance
              ) {
                this.targetX += dx;
                this.targetY += dy;
                distanceMoved++;
                if (
                  (this.targetX === playerX && this.targetY === playerY) ||
                  (this.targetX === playerX - 1 && this.targetY === playerY) ||
                  (this.targetX === playerX + 1 && this.targetY === playerY) ||
                  (this.targetX === playerX && this.targetY === playerY - 1) ||
                  (this.targetX === playerX && this.targetY === playerY + 1)
                )
                  this.room.hitwarnings.push(
                    new HitWarning(
                      this.game,
                      this.targetX,
                      this.targetY,
                      this.x,
                      this.y,
                    ),
                  );
              }
              this.visualTargetX = this.targetX + 0.5 * dx;
              this.visualTargetY = this.targetY + 0.5 * dy;
              if (dy === 1) this.visualTargetY += 0.65;
              if (dx > 0) this.direction = Direction.RIGHT;
              else if (dx < 0) this.direction = Direction.LEFT;
              else if (dy < 0) this.direction = Direction.UP;
              else if (dy > 0) this.direction = Direction.DOWN;
              break;
            }
          }
        }
      } else if (this.state === ChargeEnemyState.ALERTED) {
        this.state = ChargeEnemyState.CHARGING;
        this.trailFrame = 0;

        for (const i in this.game.players) {
          if (
            (this.y === this.game.players[i].y &&
              ((this.x < this.game.players[i].x &&
                this.game.players[i].x <= this.targetX) ||
                (this.targetX <= this.game.players[i].x &&
                  this.game.players[i].x < this.x))) ||
            (this.x === this.game.players[i].x &&
              ((this.y < this.game.players[i].y &&
                this.game.players[i].y <= this.targetY) ||
                (this.targetY <= this.game.players[i].y &&
                  this.game.players[i].y < this.y)))
          ) {
            this.game.players[i].hurt(this.hit(), this.name);
          }
        }

        this.startX = this.x;
        this.startY = this.y;
        this.drawX = this.targetX - this.x;
        this.drawY = this.targetY - this.y;
        this.x = this.targetX;
        this.y = this.targetY;
      } else if (this.state === ChargeEnemyState.CHARGING) {
        this.state = ChargeEnemyState.IDLE;
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (
        (this.state === ChargeEnemyState.CHARGING &&
          Math.abs(this.drawX) > 0.1) ||
        Math.abs(this.drawY) > 0.1
      ) {
        GenericParticle.spawnCluster(
          this.room,
          this.x - this.drawX + 0.5,
          this.y - this.drawY + 0.5,
          "black",
        );
        GenericParticle.spawnCluster(
          this.room,
          this.x - this.drawX + 0.5,
          this.y - this.drawY + 0.5,
          "white",
        );
      }

      if (this.state === ChargeEnemyState.CHARGING || this.trailAlpha < 1) {
        this.trailFrame += 0.03 * delta;
        let t = this.trailFrame;

        if (t >= 0 && t <= 1) {
          Game.ctx.strokeStyle = "white";
          if (GameConstants.ALPHA_ENABLED) {
            this.trailAlpha = 1 - t;
            Game.ctx.globalAlpha = this.trailAlpha;
          }

          Game.ctx.lineWidth = GameConstants.TILESIZE * 0.25;
          Game.ctx.beginPath();
          Game.ctx.moveTo(
            (this.startX + 0.5) * GameConstants.TILESIZE,
            (this.startY + 0.5) * GameConstants.TILESIZE,
          );
          Game.ctx.lineCap = "round";
          Game.ctx.lineTo(
            (this.x - this.drawX + 0.5) * GameConstants.TILESIZE,
            (this.y - this.drawY + 0.5) * GameConstants.TILESIZE,
          );
          Game.ctx.stroke();
          Game.ctx.globalAlpha = 1;
        }
        if (this.trailAlpha <= 0) this.trailAlpha = 1;
      }

      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX + Math.floor(this.frame),
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
      );
      if (!this.cloned) {
        if (this.state === ChargeEnemyState.IDLE) {
          this.drawSleepingZs(delta);
        } else if (this.state === ChargeEnemyState.ALERTED) {
          this.drawExclamation(delta);
        }
      }
    }
    this.drawChargeBeam(delta);
    Game.ctx.restore();
  };

  drawChargeBeam = (delta: number) => {
    if (this.dying) return;
    this.drawableY = this.y;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true,
    );
    this.drawX += -0.1 * this.drawX;
    this.drawY += -0.1 * this.drawY;

    if (this.state === ChargeEnemyState.ALERTED) {
      this.trailFrame += 0.2 * delta;

      if (Math.floor(this.trailFrame) % 2 === 0) {
        let startX = (this.x + 0.5) * GameConstants.TILESIZE;
        let startY = (this.y - 0.25) * GameConstants.TILESIZE;
        if (this.direction === Direction.LEFT) startX -= 3;
        else if (this.direction === Direction.RIGHT) startX += 3;
        else if (this.direction === Direction.DOWN) startY += 2;
        else if (this.direction === Direction.UP) startY -= 8;

        // Calculate end coordinates based on direction and max distance
        let endX = this.visualTargetX;
        let endY = this.visualTargetY;

        // Cap the beam length to maxChargeDistance
        const dx =
          this.direction === Direction.LEFT
            ? -1
            : this.direction === Direction.RIGHT
              ? 1
              : 0;
        const dy =
          this.direction === Direction.UP
            ? -1
            : this.direction === Direction.DOWN
              ? 1
              : 0;

        const distance = Math.max(
          Math.abs(this.visualTargetX - this.x),
          Math.abs(this.visualTargetY - this.y),
        );

        if (distance > this.maxChargeDistance) {
          endX = this.x + dx * this.maxChargeDistance;
          endY = this.y + dy * this.maxChargeDistance;
          if (dy === 1) endY += 0.65;
          if (dx > 0) endX += 0.5;
          else if (dx < 0) endX -= 0.5;
        }

        Game.ctx.strokeStyle = "white";
        Game.ctx.lineWidth = GameConstants.TILESIZE * 0.1;
        Game.ctx.beginPath();
        Game.ctx.moveTo(Math.round(startX), Math.round(startY));
        Game.ctx.lineCap = "round";
        Game.ctx.lineTo(
          Math.round((endX + 0.5) * GameConstants.TILESIZE),
          Math.round((endY - 0.25) * GameConstants.TILESIZE),
        );
        Game.ctx.stroke();
        Game.ctx.globalAlpha = 1;
      }
    }
  };
}
