import { Entity, EntityDirection } from "../entity";
import { Game } from "../../game";
import { Room } from "../../room";
import { Player } from "../../player";
import { HitWarning } from "../../hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../weapon/spear";
import { DualDagger } from "../../weapon/dualdagger";
import { GreenGem } from "../../item/greengem";
import { Random } from "../../random";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Candle } from "../../item/candle";
import { Door } from "../../tile/door";
import { Enemy } from "./enemy";
import { ImageParticle } from "../../particle/imageParticle";

export class BishopEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 2;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 31;
    this.tileY = 8;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "bishop";
    this.jumpHeight = 1;
    this.drawMoveSpeed = 0.2;
    this.diagonalAttackRange = 1;
    this.diagonalAttack = true;
    this.orthogonalAttack = false;
    if (drop) this.drop = drop;
    else {
      let dropProb = Random.rand();
      if (dropProb < 0.005) this.drop = new Candle(this.room, this.x, this.y);
      else if (dropProb < 0.04)
        this.drop = new GreenGem(this.room, this.x, this.y);
      else this.drop = new Coin(this.room, this.x, this.y);
    }
  }

  tryMove = (x: number, y: number) => {
    let pointWouldBeIn = (someX: number, someY: number): boolean => {
      return (
        someX >= x && someX < x + this.w && someY >= y && someY < y + this.h
      );
    };
    let enemyCollide = (enemy: Entity): boolean => {
      if (enemy.x >= x + this.w || enemy.x + enemy.w <= x) return false;
      if (enemy.y >= y + this.h || enemy.y + enemy.h <= y) return false;
      return true;
    };
    for (const e of this.room.entities) {
      if (e !== this && enemyCollide(e)) {
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
    return 1;
  };

  hurt = (playerHitBy: Player, damage: number) => {
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID])
        this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
    }
    this.health -= damage;
    this.healthBar.hurt();
    if (this.health <= 0) {
      ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 26);

      this.kill();
    }
  };

  jump = () => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.sin(j * Math.PI) * this.jumpHeight;
  };

  behavior = () => {
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
      this.ticks++;
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
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
              if (this.room.roomArray[xx][yy] instanceof Door) {
                // don't walk into doorways (normally wouldn't be an issue without diagonals)
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
          disablePositions.push({ x: this.x + 1, y: this.y } as astar.Position);
          disablePositions.push({ x: this.x - 1, y: this.y } as astar.Position);
          disablePositions.push({ x: this.x, y: this.y + 1 } as astar.Position);
          disablePositions.push({ x: this.x, y: this.y - 1 } as astar.Position);
          disablePositions.push({ x: this.x, y: this.y } as astar.Position);
          let moves = astar.AStar.search(
            grid,
            this,
            this.targetPlayer,
            disablePositions,
            true, //diagonals
          );
          moves = moves.filter((move) => {
            const dx = Math.abs(move.pos.x - this.x);
            const dy = Math.abs(move.pos.y - this.y);
            return dx === 1 && dy === 1;
          });
          if (moves.length > 0) {
            let moveX = moves[0].pos.x;
            let moveY = moves[0].pos.y;
            let hitPlayer = false;
            for (const i in this.game.players) {
              if (
                this.game.rooms[this.game.players[i].levelID] === this.room &&
                this.game.players[i].x === moveX &&
                this.game.players[i].y === moveY
              ) {
                this.game.players[i].hurt(this.hit(), this.name);
                this.drawX = 0.5 * (this.x - this.game.players[i].x);
                this.drawY = 0.5 * (this.y - this.game.players[i].y);
                hitPlayer = true;
                if (
                  this.game.players[i] ===
                  this.game.players[this.game.localPlayerID]
                )
                  this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
              }
            }
            if (!hitPlayer) {
              this.tryMove(moveX, moveY);
              this.setDrawXY(oldX, oldY);
            }
          }
          this.makeHitWarnings();
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
                this.makeHitWarnings();
              }
            }
          }
        }
      }
    }
  };

  draw = (delta: number) => {
    if (!this.dead) {
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

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
        this.tileX + Math.floor(this.frame),
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY * delta,
        1,
        2,
        this.room.shadeColor,
        this.shadeAmount() * (1 + (this.jumpY * delta) / 3),
      );
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta);
    }
  };
}
