import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { globalEventBus } from "../../eventBus";
import { Sound } from "../../sound";

enum EnemyState {
  SLEEP,
  AGGRO,
  ATTACK,
  DEAD,
  IDLE,
}

interface EnemyStatus {
  poison: {
    active: boolean;
    hitCount: number;
    startTick: number;
    effectTick: number;
  };
  bleed: {
    active: boolean;
    hitCount: number;
    startTick: number;
    effectTick: number;
  };
}

export abstract class Enemy extends Entity {
  seenPlayer: boolean;
  heardPlayer: boolean;
  frame: number;
  ticks: number;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  status: EnemyStatus;
  protected jumpY: number;
  protected jumpHeight: number;
  static difficulty: number = 1;
  private effectStartTick: number;
  private startTick: number;
  private poisonHitCount;
  private bleedHitCount;
  protected alertRange;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.drawYOffset = 1.5;
    this.name = "";
    this.seenPlayer = false;
    this.heardPlayer = false;
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
    this.dropChance = 10;
    this.status = {
      poison: { active: false, hitCount: 0, startTick: 0, effectTick: 0 },
      bleed: { active: false, hitCount: 0, startTick: 0, effectTick: 0 },
    };
    this.alertRange = 4;
    this.effectStartTick = 1;
    this.startTick = 1;
    this.isEnemy = true;
    this.poisonHitCount = 0;
    this.bleedHitCount = 0;
    this.drawMoveSpeed = 0.85; //lower is faster
    //this.getDrop(["weapon", "equipment", "consumable", "gem", "tool", "coin"]);
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

  handleEnemyCase = (playerHitBy?: Player) => {
    if (!playerHitBy) return;
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      //this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID])
        this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
    }
  };

  poison = () => {
    if (!this.status.poison.active) {
      this.status.poison = {
        active: true,
        hitCount: 0,
        startTick: this.ticks,
        effectTick: this.ticks % 3,
      };
      this.shadeColor = "#00FF00";
    }
  };

  bleed = () => {
    if (!this.status.bleed.active) {
      this.status.bleed = {
        active: true,
        hitCount: 0,
        startTick: this.ticks,
        effectTick: this.ticks % 1,
      };
    }
  };

  tickPoison = () => {
    if (this.status.poison.active && this.targetPlayer) {
      if (
        this.ticks % 3 === this.status.poison.effectTick &&
        this.ticks !== this.status.poison.startTick &&
        this.health >= 1
      ) {
        this.hurt(this.targetPlayer, 1, "poison");
        this.shadeColor = "#00FF00";
        //this.status.poison.hitCount++;

        /*
        if (this.status.poison.hitCount >= 2) {
          this.status.poison = {
            active: false,
            hitCount: 0,
            startTick: 0,
            effectTick: 0,
          };
        }
        */
      }
    }
  };

  tickBleed = () => {
    if (this.status.bleed.active && this.targetPlayer) {
      if (
        this.ticks % 1 === this.status.bleed.effectTick &&
        this.ticks !== this.status.bleed.startTick
      ) {
        this.hurt(this.targetPlayer, 0.5, "blood");
        //this.targetPlayer.heal(0.5);
        this.shadeColor = "#FF0000";
        this.status.bleed.hitCount++;

        if (this.status.bleed.hitCount >= 4) {
          this.status.bleed = {
            active: false,
            hitCount: 0,
            startTick: 0,
            effectTick: 0,
          };
        }
      }
    }
  };

  tick = () => {
    console.log(this.name, this.ticks);
    this.tickPoison();
    this.tickBleed();
    this.behavior();
    if (this.x !== this.lastX || this.y !== this.lastY) {
      this.emitEntityData();
    }
    if (this.shielded) this.shield.updateLightSourcePos();
  };

  lookForPlayer = (face: boolean = true) => {
    if (this.seenPlayer) return;

    const p = this.nearestPlayer();
    if (p === false) return;

    const [distance, player] = p;
    if (distance > this.alertRange) return;

    this.targetPlayer = player;
    if (face) this.facePlayer(player);
    this.seenPlayer = true;

    globalEventBus.emit("EnemySeenPlayer", {
      enemyType: this.constructor.name,
      enemyName: this.name,
    });

    if (player === this.game.players[this.game.localPlayerID]) {
      this.alertTicks = 1;
    }

    this.makeHitWarnings();
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
      this.direction,
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
            this.direction,
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
            if (moveX > oldX) this.direction = Direction.RIGHT;
            else if (moveX < oldX) this.direction = Direction.LEFT;
            else if (moveY > oldY) this.direction = Direction.DOWN;
            else if (moveY < oldY) this.direction = Direction.UP;

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
                this.setDrawXY(moveX, moveY);
                if (this.x > moveX) this.direction = Direction.RIGHT;
                else if (this.x < moveX) this.direction = Direction.LEFT;
                else if (this.y > moveY) this.direction = Direction.DOWN;
                else if (this.y < moveY) this.direction = Direction.UP;
              }
            }
          }

          // Add positions to avoid based on the current direction
          if (this.direction == Direction.LEFT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == Direction.RIGHT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == Direction.DOWN) {
            disablePositions.push({
              x: this.x + 1,
              y: this.y,
            } as astar.Position);
            disablePositions.push({
              x: this.x - 1,
              y: this.y,
            } as astar.Position);
          }
          if (this.direction == Direction.UP) {
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

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.abs(Math.sin(j * Math.PI)) * this.jumpHeight;
    if (this.jumpY < 0.01) this.jumpY = 0;
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };

  updateDrawXY = (delta: number) => {
    //putting this here bc i'm lazy
    this.updateHurtFrame(delta);
    this.animateDying(delta);

    if (!this.doneMoving()) {
      this.drawX *= this.drawMoveSpeed ** delta;
      this.drawY *= this.drawMoveSpeed ** delta;

      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
      this.jump(delta);
    }

    this.updateShadeColor(delta);
  };

  setDrawXY = (x: number, y: number) => {
    this.drawX += this.x - x;
    this.drawY += this.y - y;
  };

  get lastPlayerPos() {
    return {
      x: this.targetPlayer.lastX,
      y: this.targetPlayer.lastY,
    };
  }

  draw = (delta: number) => {
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
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
      );
    }
    if (!this.dying) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
  };

  get type() {
    return EntityType.ENEMY;
  }
}
