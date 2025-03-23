import { Direction, Game } from "../../game";
import { Room } from "../../room";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";

export class KnightEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  targetPlayer: Player;
  aggro: boolean;
  drop: Item;
  static difficulty: number = 2;
  static tileX: number = 9;
  static tileY: number = 8;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 2;
    this.maxHealth = 2;
    this.tileX = 9;
    this.tileY = 8;
    this.seenPlayer = false;
    this.aggro = false;
    this.deathParticleColor = "#ffffff";
    this.lastX = this.x;
    this.lastY = this.y;
    this.name = "burrow knight";
    this.orthogonalAttack = true;
    this.imageParticleX = 3;
    this.imageParticleY = 29;
    if (drop) this.drop = drop;
    if (Math.random() < this.dropChance) {
      this.getDrop([
        "weapon",
        "equipment",
        "consumable",
        "gem",
        "tool",
        "coin",
      ]);
    }
  }

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
      if (!this.seenPlayer) {
        const result = this.nearestPlayer();
        if (result !== false) {
          let [distance, p] = result;
          if (distance < 4) {
            this.rumbling = true;
            this.seenPlayer = true;
            this.targetPlayer = p;
            this.facePlayer(p);
            if (p === this.game.players[this.game.localPlayerID])
              this.alertTicks = 1;
            this.makeHitWarnings();
          }
        }
      } else if (this.seenPlayer) {
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
            let moves = astar.AStar.search(
              grid,
              this,
              this.targetPlayer,
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
            this.makeHitWarnings();
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
                  this.rumbling = true;
                  this.makeHitWarnings();
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
    let rumbleX = this.rumble(this.rumbling, this.frame).x;
    let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;
    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.ticks % 2 === 0) {
        this.tileX = 9;
        this.tileY = 8;
      } else {
        this.tileX = 4;
        this.tileY = 0;
      }

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
        this.tileX + (this.tileX === 4 ? 0 : Math.floor(this.frame)),
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX + rumbleX,
        this.y -
          this.drawYOffset -
          this.drawY +
          (this.tileX === 4 ? 0.1875 : 0),
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
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
