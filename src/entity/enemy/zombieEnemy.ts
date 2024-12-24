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
import { DualDagger } from "../../weapon/dualdagger";
import { GreenGem } from "../../item/greengem";
import { Random } from "../../random";
import { astar } from "../../astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Pickaxe } from "../../weapon/pickaxe";
import { ImageParticle } from "../../particle/imageParticle";
import { Enemy } from "./enemy";

export class ZombieEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  dir: Direction;
  static difficulty: number = 1;
  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 17;
    this.tileY = 8;
    this.seenPlayer = false;
    this.aggro = false;
    this.dir = Direction.DOWN;
    this.name = "zombie";
    this.forwardOnlyAttack = true;
    this.drawMoveSpeed = 0.2;
    this.jumpHeight = 0.35;
    if (drop) this.drop = drop;
    if (Math.random() < this.dropChance) {
      this.getDrop(["consumable", "gem", "tool", "coin"]);
    }
  }

  hit = (): number => {
    return 1;
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
                this.setDrawXY(oldX, oldY);

                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
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

  draw = (delta: number) => {
    if (this.dead) return;
    //this.updateShadeColor(delta);
    Game.ctx.globalAlpha = this.alpha;
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
        this.shadeColor,
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

    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
    Game.ctx.globalAlpha = 1;
  };
}
