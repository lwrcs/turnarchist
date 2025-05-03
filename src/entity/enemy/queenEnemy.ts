import { Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Enemy } from "./enemy";

export class QueenEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 4;
  static tileX: number = 23;
  static tileY: number = 8;
  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 2;
    this.maxHealth = 2;
    this.tileX = 23;
    this.tileY = 10;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "queen";
    this.orthogonalAttack = true;
    this.diagonalAttack = true;
    this.jumpHeight = 1;
    this.imageParticleX = 6;
    this.imageParticleY = 28; //includes crown particle
    if (drop) this.drop = drop;
    this.getDrop(["weapon", "equipment", "consumable", "gem", "tool", "coin"]);
  }

  hit = (): number => {
    return 1;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.health <= 1) this.imageParticleY = 29; //no crown particle
    if (!this.dead) {
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }
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
            this.makeHitWarnings();
          }
        }
      } else if (this.seenPlayer) {
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
            true, //diagonals
            false, //diagonalsOnly
            undefined,
            undefined,
            undefined,
            false, //diagonalsOmni
          );
          if (moves.length > 0) {
            disablePositions.push({ x: oldX + 1, y: oldY } as astar.Position);
            disablePositions.push({ x: oldX - 1, y: oldY } as astar.Position);
            disablePositions.push({ x: oldX, y: oldY + 1 } as astar.Position);
            disablePositions.push({ x: oldX, y: oldY - 1 } as astar.Position);
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
                if (
                  this.game.players[i] ===
                  this.game.players[this.game.localPlayerID]
                )
                  this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
              }
            }
            if (!hitPlayer) {
              //if ()
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

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));

    let jumpY = Math.abs(Math.sin(j * Math.PI)) * this.jumpHeight;
    if (jumpY < 0.01) jumpY = 0;
    if (jumpY > this.jumpHeight) jumpY = this.jumpHeight;
    this.jumpY = jumpY;
  };

  draw = (delta: number) => {
    const offsetTileY = this.health <= 1 ? 0 : -2;
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);
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
        this.tileY + offsetTileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount() * (1 + this.jumpY / 3),
      );
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
    Game.ctx.restore();
  };
}
