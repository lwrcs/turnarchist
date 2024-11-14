import { Entity, EntityDirection } from "../entity";
import { Game } from "../../game";
import { Room } from "../../room";
import { HitWarning } from "../../hitWarning";
import { Coin } from "../../item/coin";
import { Door } from "../../tile/door";
import { GenericParticle } from "../../particle/genericParticle";
import { GameConstants } from "../../gameConstants";
import { Random } from "../../random";
import { Pickaxe } from "../../weapon/pickaxe";
import { GreenGem } from "../../item/greengem";
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

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
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
    else {
      let dropProb = Random.rand();
      if (dropProb < 0.025) this.drop = new Pickaxe(this.room, this.x, this.y);
      else if (dropProb < 0.02)
        this.drop = new GreenGem(this.room, this.x, this.y);
      else this.drop = new Coin(this.room, this.x, this.y);
    }
  }

  hit = (): number => {
    return 1;
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
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.ticks++;
      if (this.state === ChargeEnemyState.IDLE) {
        let blocked = false;
        let dx = 0;
        let dy = 0;
        for (const i in this.game.players) {
          if (this.x === this.game.players[i].x) {
            if (this.y < this.game.players[i].y) dy = 1;
            else dy = -1;
            for (let yy = this.y; yy !== this.game.players[i].y; yy += dy) {
              if (!this.canMoveOver(this.x, yy)) blocked = true;
            }
          } else if (this.y === this.game.players[i].y) {
            if (this.x < this.game.players[i].x) dx = 1;
            else dx = -1;
            for (let xx = this.x; xx !== this.game.players[i].x; xx += dx) {
              if (!this.canMoveOver(xx, this.y)) blocked = true;
            }
          }
          if ((dx !== 0 || dy !== 0) && !blocked) {
            this.state = ChargeEnemyState.ALERTED;
            this.targetX = this.x;
            this.targetY = this.y;
            while (this.canMoveOver(this.targetX + dx, this.targetY + dy)) {
              this.targetX += dx;
              this.targetY += dy;
              if (
                (this.targetX === this.game.players[i].x &&
                  this.targetY === this.game.players[i].y) ||
                (this.targetX === this.game.players[i].x - 1 &&
                  this.targetY === this.game.players[i].y) ||
                (this.targetX === this.game.players[i].x + 1 &&
                  this.targetY === this.game.players[i].y) ||
                (this.targetX === this.game.players[i].x &&
                  this.targetY === this.game.players[i].y - 1) ||
                (this.targetX === this.game.players[i].x &&
                  this.targetY === this.game.players[i].y + 1)
              )
                this.room.hitwarnings.push(
                  new HitWarning(
                    this.game,
                    this.targetX,
                    this.targetY,
                    this.x,
                    this.y
                  )
                );
            }
            this.visualTargetX = this.targetX + 0.5 * dx;
            this.visualTargetY = this.targetY + 0.5 * dy;
            if (dy === 1) this.visualTargetY += 0.65;
            if (dx > 0) this.direction = EntityDirection.RIGHT;
            else if (dx < 0) this.direction = EntityDirection.LEFT;
            else if (dy < 0) this.direction = EntityDirection.UP;
            else if (dy > 0) this.direction = EntityDirection.DOWN;
            break;
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
    if (!this.dead) {
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
          "black"
        );
        GenericParticle.spawnCluster(
          this.room,
          this.x - this.drawX + 0.5,
          this.y - this.drawY + 0.5,
          "white"
        );
      }

      if (this.state === ChargeEnemyState.CHARGING) {
        this.trailFrame += 0.01 * delta;
        let t = this.trailFrame;

        if (t >= 0 && t <= 1) {
          Game.ctx.strokeStyle = "white";
          if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 1 - t;
          Game.ctx.lineWidth = GameConstants.TILESIZE * 0.25;
          Game.ctx.beginPath();
          Game.ctx.moveTo(
            (this.startX + 0.5) * GameConstants.TILESIZE,
            (this.startY + 0.5) * GameConstants.TILESIZE
          );
          Game.ctx.lineCap = "round";
          Game.ctx.lineTo(
            (this.x - this.drawX + 0.5) * GameConstants.TILESIZE,
            (this.y - this.drawY + 0.5) * GameConstants.TILESIZE
          );
          Game.ctx.stroke();
          Game.ctx.globalAlpha = 1;
        }
      }

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
        this.tileX + Math.floor(this.frame),
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
      if (this.state === ChargeEnemyState.IDLE) {
        this.drawSleepingZs(delta);
      } else if (this.state === ChargeEnemyState.ALERTED) {
        this.drawExclamation(delta);
      }
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true
    );
    this.drawX += -0.1 * this.drawX;
    this.drawY += -0.1 * this.drawY;

    if (this.state === ChargeEnemyState.ALERTED) {
      this.trailFrame += 0.4 * delta;

      if (Math.floor(this.trailFrame) % 2 === 0) {
        let startX = (this.x + 0.5) * GameConstants.TILESIZE;
        let startY = (this.y - 0.25) * GameConstants.TILESIZE;
        if (this.direction === EntityDirection.LEFT) startX -= 3;
        else if (this.direction === EntityDirection.RIGHT) startX += 3;
        else if (this.direction === EntityDirection.DOWN) startY += 2;
        else if (this.direction === EntityDirection.UP) startY -= 8;

        Game.ctx.strokeStyle = "white";
        Game.ctx.lineWidth = GameConstants.TILESIZE * 0.25;
        Game.ctx.beginPath();
        Game.ctx.moveTo(Math.round(startX), Math.round(startY));
        Game.ctx.lineCap = "round";
        Game.ctx.lineTo(
          Math.round((this.visualTargetX + 0.5) * GameConstants.TILESIZE),
          Math.round((this.visualTargetY - 0.25) * GameConstants.TILESIZE)
        );
        Game.ctx.stroke();
        Game.ctx.globalAlpha = 1;
      }
    }
  };
}
