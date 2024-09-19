import { Entity, EntityDirection } from "./entity";
import { Game } from "../game";
import { Room } from "../room";
import { astar } from "../astarclass";
import { HitWarning } from "../hitWarning";
import { SpikeTrap } from "../tile/spiketrap";
import { Coin } from "../item/coin";
import { Player } from "../player";
import { DualDagger } from "../weapon/dualdagger";
import { Item } from "../item/item";
import { GameConstants } from "../gameConstants";

export class SlimeEnemy extends Entity {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;

  constructor(level: Room, game: Game, x: number, y: number, rand: () => number, drop?: Item) {
    super(level, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 8;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.deathParticleColor = "#ffffff";

    if (drop) this.drop = drop;
    else {
      this.drop = new Coin(this.room, 0, 0);
    }
  }

  hurt = (playerHitBy: Player, damage: number) => {
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID]) this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
    }
    this.healthBar.hurt();

    this.health -= damage;
    if (this.health <= 0) this.kill();
    else this.hurtCallback();
  };

  hit = (): number => {
    return 1;
  };

  tick = () => {
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
            this.seenPlayer = true;
            this.targetPlayer = p;
            this.facePlayer(p);
            if (p === this.game.players[this.game.localPlayerID]) this.alertTicks = 1;
            this.makeHitWarnings(true, false, false, this.direction)
          }
        }
      }
      else if (this.seenPlayer) {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          this.ticks++;
          if (this.ticks % 2 === 1) {
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
                else
                  grid[x][y] = false;
              }
            }
            let moves = astar.AStar.search(
              grid,
              this,
              this.targetPlayer,
              disablePositions
            );
            if (moves.length > 0) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moves[0].pos.x &&
                  this.game.players[i].y === moves[0].pos.y
                ) {
                  this.game.players[i].hurt(this.hit(), "crab");
                  this.drawX = 0.5 * (this.x - this.game.players[i].x);
                  this.drawY = 0.5 * (this.y - this.game.players[i].y);
                  if (this.game.players[i] === this.game.players[this.game.localPlayerID])
                    this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  hitPlayer = true;
                }
              }
              if (!hitPlayer) {
                this.tryMove(moves[0].pos.x, moves[0].pos.y);
                this.drawX = this.x - oldX;
                this.drawY = this.y - oldY;
                if (this.x > oldX) this.direction = EntityDirection.RIGHT;
                else if (this.x < oldX) this.direction = EntityDirection.LEFT;
                else if (this.y > oldY) this.direction = EntityDirection.DOWN;
                else if (this.y < oldY) this.direction = EntityDirection.UP;
              }
            }
          } else {
            this.makeHitWarnings(true, false, false, this.direction)
          }
        }

        let targetPlayerOffline = Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !== -1;
        if (!this.aggro || targetPlayerOffline) {
          let p = this.nearestPlayer();
          if (p !== false) {
            let [distance, player] = p;
            if (distance <= 4 && (targetPlayerOffline || distance < this.playerDistance(this.targetPlayer))) {
              if (player !== this.targetPlayer) {
                this.targetPlayer = player;
                this.facePlayer(player);
                if (player === this.game.players[this.game.localPlayerID]) this.alertTicks = 1;
                if (this.ticks % 2 === 0) {
                  this.makeHitWarnings(true, false, false, this.direction)
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
      if (this.ticks % 2 === 0) {
        this.tileX = 9;
        this.tileY = 4;
      } else {
        this.tileX = 8;
        this.tileY = 4;
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
          this.shadeAmount()
        );
      Game.drawMob(
        this.tileX,
        this.tileY + this.direction,
        1,
        1,
        this.x - this.drawX,
        this.y - this.drawY,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount()
      );
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta, 0, 0.75 * GameConstants.TILESIZE);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta, 0, 0.75 * GameConstants.TILESIZE);
    }
  };

}
