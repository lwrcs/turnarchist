import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room";
import { Player } from "../../player";
import { HitWarning } from "../../hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../weapon/spear";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { DeathParticle } from "../../particle/deathParticle";
import { Candle } from "../../item/candle";
import { EntityType } from "../entity";
import { ItemType } from "../../gameState";
import { ImageParticle } from "../../particle/imageParticle";
import { globalEventBus } from "../../eventBus";

enum EnemyState {
  SLEEP,
  AGGRO,
  ATTACK,
  DEAD,
  IDLE,
}

export abstract class Enemy extends Entity {
  seenPlayer: boolean;
  frame: number;
  ticks: number;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  protected jumpY: number;
  protected jumpHeight: number;
  //dir: Direction;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.drawYOffset = 1.5;
    this.name = "";
    this.seenPlayer = false;
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 17;
    this.tileY = 8;
    this.aggro = false;
    this.jumpY = 0;
    this.jumpHeight = 0.3;
    //this.dir = Direction.South;
    this.name = "generic enemy";
  }

  readonly tryMove = (x: number, y: number, collide: boolean = true) => {
    let pointWouldBeIn = (someX: number, someY: number): boolean => {
      return (
        someX >= x && someX < x + this.w && someY >= y && someY < y + this.h
      );
    };
    let entityCollide = (entity: Entity): boolean => {
      if (entity.x >= x + this.w || entity.x + entity.w <= x) return false;
      if (entity.y >= y + this.h || entity.y + entity.h <= y) return false;
      return true;
    };
    for (const e of this.room.entities) {
      if (e !== this && entityCollide(e) && collide) {
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
    ImageParticle.spawnCluster(this.room, this.x + 0.5, this.y + 0.5, 0, 26);
    this.healthBar.hurt();
    if (this.health <= 0) {
      this.kill();
    } else {
    }
  };

  tick = () => {
    this.behavior();
    if (this.x !== this.lastX || this.y !== this.lastY) {
      this.emitEntityData();
    }
  };
  lookForPlayer = () => {
    let p = this.nearestPlayer();
    if (p !== false) {
      let [distance, player] = p;
      if (distance <= 4) {
        this.targetPlayer = player;
        this.facePlayer(player);
        this.seenPlayer = true;
        let type = this.constructor;
        globalEventBus.emit("EnemySeenPlayer", {
          enemyType: this.constructor.name,
          enemyName: this.name,
        });
        if (player === this.game.players[this.game.localPlayerID])
          this.alertTicks = 1;
        this.makeHitWarnings();
      }
    }
  };

  getDisablePositions = (): Array<astar.Position> => {
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
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
    return disablePositions;
  };

  findPath = () => {
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
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
    // Create a grid of the room
    let grid = [];
    for (let x = 0; x < this.room.roomX + this.room.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.room.roomY + this.room.height; y++) {
        if (this.room.roomArray[x] && this.room.roomArray[x][y])
          grid[x][y] = this.room.roomArray[x][y];
        else grid[x][y] = false;
      }
    }

    // Find a path to the target player
    let moves = astar.AStar.search(
      grid,
      this,
      this.targetPlayer,
      disablePositions,
      false,
      false,
      true,
      this.direction
    );
  };

  behavior = () => {
    // Store the current position
    this.lastX = this.x;
    this.lastY = this.y;

    // If the enemy is not dead
    if (!this.dead) {
      // Skip turns if necessary
      if (this.skipNextTurns > 0) {
        this.skipNextTurns--;
        return;
      }

      // Increment the tick counter
      this.ticks++;

      // If the enemy has not seen the player yet
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        // If the target player has taken their turn
        if (this.room.playerTicked === this.targetPlayer) {
          // Decrement alert ticks
          this.alertTicks = Math.max(0, this.alertTicks - 1);

          // Store the old position
          let oldX = this.x;
          let oldY = this.y;

          // Create a list of positions to avoid
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
                // Don't walk on active spike traps
                disablePositions.push({ x: xx, y: yy } as astar.Position);
              }
            }
          }
          // Create a grid of the room
          let grid = [];
          for (let x = 0; x < this.room.roomX + this.room.width; x++) {
            grid[x] = [];
            for (let y = 0; y < this.room.roomY + this.room.height; y++) {
              if (this.room.roomArray[x] && this.room.roomArray[x][y])
                grid[x][y] = this.room.roomArray[x][y];
              else grid[x][y] = false;
            }
          }

          // Find a path to the target player
          let moves = astar.AStar.search(
            grid,
            this,
            this.targetPlayer,
            disablePositions,
            false,
            false,
            true,
            this.direction
          );

          // If there are moves available
          if (moves.length > 0) {
            let moveX = moves[0].pos.x;
            let moveY = moves[0].pos.y;
            let oldDir = this.direction;
            let player = this.targetPlayer;

            // Face the target player
            this.facePlayer(player);

            // Determine the new direction based on the move
            if (moveX > oldX) this.direction = EntityDirection.RIGHT;
            else if (moveX < oldX) this.direction = EntityDirection.LEFT;
            else if (moveY > oldY) this.direction = EntityDirection.DOWN;
            else if (moveY < oldY) this.direction = EntityDirection.UP;

            // If the direction hasn't changed, attempt to move or attack
            if (oldDir == this.direction) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moveX &&
                  this.game.players[i].y === moveY
                ) {
                  // Attack the player if they are in the way
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
                // Move to the new position
                this.tryMove(moveX, moveY);
                this.drawX = this.x - oldX;
                this.drawY = this.y - oldY;
                if (this.x > oldX) this.direction = EntityDirection.RIGHT;
                else if (this.x < oldX) this.direction = EntityDirection.LEFT;
                else if (this.y > oldY) this.direction = EntityDirection.DOWN;
                else if (this.y < oldY) this.direction = EntityDirection.UP;
              }
            }
          }

          // Add positions to avoid based on the current direction
          if (this.direction == EntityDirection.LEFT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == EntityDirection.RIGHT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == EntityDirection.DOWN) {
            disablePositions.push({
              x: this.x + 1,
              y: this.y,
            } as astar.Position);
            disablePositions.push({
              x: this.x - 1,
              y: this.y,
            } as astar.Position);
          }
          if (this.direction == EntityDirection.UP) {
            disablePositions.push({
              x: this.x + 1,
              y: this.y,
            } as astar.Position);
            disablePositions.push({
              x: this.x - 1,
              y: this.y,
            } as astar.Position);
          }
          // Make hit warnings
          this.makeHitWarnings();
        }

        // Check if the target player is offline
        let targetPlayerOffline =
          Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !==
          -1;
        // If the enemy is not aggro or the target player is offline, find a new target player
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

  updateDrawXY = (delta: number) => {
    if (!this.doneMoving()) {
      this.drawX += -0.3 * delta * this.drawX;
      this.drawY += -0.3 * delta * this.drawY;
      this.jump();
    }
  };

  jump = () => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.sin(j * Math.PI) * this.jumpHeight;
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
    }
    if (!this.seenPlayer) {
      this.drawSleepingZs(delta);
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(delta);
    }
  };

  get type() {
    return EntityType.ENEMY;
  }
}
