import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { HitWarning } from "../../drawable/hitWarning";
import { GenericParticle } from "../../particle/genericParticle";
import { Coin } from "../../item/coin";
import { RedGem } from "../../item/resource/redgem";
import { Item } from "../../item/item";
import { Spear } from "../../item/weapon/spear";
import { DualDagger } from "../../item/weapon/dualdagger";
import { GreenGem } from "../../item/resource/greengem";
import { Random } from "../../utility/random";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Pickaxe } from "../../item/tool/pickaxe";
import { ImageParticle } from "../../particle/imageParticle";
import { Enemy } from "./enemy";

export class BigZombieEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  dir: Direction;
  static difficulty: number = 1;
  static tileX: number = 21;
  static tileY: number = 0;
  static examineText = "A big zombie. Wide and stubborn.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.w = 2;
    this.h = 2;

    this.ticks = 0;
    this.frame = 0;
    this.health = 3;
    this.maxHealth = 3;
    this.defaultMaxHealth = 3;
    this.tileX = 31;
    this.tileY = 12;
    this.seenPlayer = false;
    this.aggro = false;
    this.dir = Direction.DOWN;
    this.name = "bigzombie";
    this.chainPushable = false;

    this.forwardOnlyAttack = true;
    this.drawMoveSpeed = 0.9;
    this.jumpHeight = 0.35;
    this.drawYOffset = 1.5;
    this.canDestroyOthers = true;

    if (drop) this.drop = drop;
    const dropAmount = Math.floor(Random.rand() * 3) + 2;
    while (this.drops.length < dropAmount && !this.cloned) {
      this.getDrop();
    }
  }

  hit = (): number => {
    return this.damage;
  };

  bleed = () => {};
  poison = () => {};

  behavior = () => {
    // Store the current position
    this.lastX = this.x;
    this.lastY = this.y;

    // If the enemy is not dead
    if (!this.dead) {
      // Skip turns if necessary
      if (this.handleSkipTurns()) return;

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

          const p = this.targetPlayer;
          const sharesRow = p.y >= this.y && p.y < this.y + this.h;
          const sharesColumn = p.x >= this.x && p.x < this.x + this.w;
          const isSolidInDir = (dir: Direction): boolean => {
            let nx = this.x, ny = this.y;
            if (dir === Direction.RIGHT) nx++;
            else if (dir === Direction.LEFT) nx--;
            else if (dir === Direction.DOWN) ny++;
            else if (dir === Direction.UP) ny--;
            for (let dx = 0; dx < this.w; dx++)
              for (let dy = 0; dy < this.h; dy++)
                if (this.room.isSolidAt(nx + dx, ny + dy, this.z ?? 0)) return true;
            return false;
          };
          if (sharesRow !== sharesColumn) {
            let desiredDir = this.direction;
            if (sharesRow) {
              desiredDir = p.x < this.x ? Direction.LEFT : Direction.RIGHT;
            } else if (sharesColumn) {
              desiredDir = p.y < this.y ? Direction.UP : Direction.DOWN;
            }
            if (desiredDir !== this.direction && !isSolidInDir(desiredDir)) {
              this.direction = desiredDir;
              this.makeBigHitWarnings();
              this.ticks++;
              return;
            }
          }

          // Build localized disables (avoid scanning the entire room's entities every tick)
          // Exclude small destroyable entities since this enemy can destroy them via tryMove
          let disablePositions = this.buildEntityDisablePositionsLocalized(
            this.targetPlayer,
            (e) => e !== this && !(e.destroyable && e.destroyableByOthers && e.w <= 1 && e.h <= 1),
          );

          // Check spike traps in a larger area for 2x2 entity
          for (let xx = this.x - 1; xx <= this.x + this.w; xx++) {
            for (let yy = this.y - 1; yy <= this.y + this.h; yy++) {
              if (
                this.room.roomArray[xx] &&
                this.room.roomArray[xx][yy] &&
                this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                (this.room.roomArray[xx][yy] as SpikeTrap).on
              ) {
                disablePositions.push({ x: xx, y: yy } as astar.Position);
              }
            }
          }

          // When the player is diagonal and in our forward direction,
          // pathfind to an aligned intermediate position so we maintain
          // current direction and line up on one axis first.
          let pathTarget: { x: number; y: number } = this.targetPlayer;
          if (!sharesRow && !sharesColumn) {
            const isForwardH =
              (this.direction === Direction.RIGHT && p.x > this.x + this.w - 1) ||
              (this.direction === Direction.LEFT && p.x < this.x);
            const isForwardV =
              (this.direction === Direction.DOWN && p.y > this.y + this.h - 1) ||
              (this.direction === Direction.UP && p.y < this.y);
            if (isForwardH) {
              pathTarget = { x: p.x, y: this.y };
            } else if (isForwardV) {
              pathTarget = { x: this.x, y: p.y };
            }
          }

          // Localized pathfinding with caching for performance
          let moves = this.searchPathLocalizedCached(
            pathTarget,
            disablePositions,
          );
          // Fall back to player position if intermediate target is unreachable
          if (moves.length === 0 && pathTarget !== this.targetPlayer) {
            this._pathCache = null;
            moves = this.searchPathLocalizedCached(
              this.targetPlayer,
              disablePositions,
            );
          }

          // If there are moves available
          if (moves.length > 0) {
            let moveX = moves[0].pos.x;
            let moveY = moves[0].pos.y;
            let oldDir = this.direction;

            // Determine the new direction based on the move
            if (moveX > oldX) this.direction = Direction.RIGHT;
            else if (moveX < oldX) this.direction = Direction.LEFT;
            else if (moveY > oldY) this.direction = Direction.DOWN;
            else if (moveY < oldY) this.direction = Direction.UP;

            // If the direction hasn't changed, attempt to move or attack
            if (oldDir == this.direction) {
              let hitPlayer = false;
              let hitAnything = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room
                ) {
                  // Check if player is within any of the 2x2 positions we're moving to
                  let playerHit = false;
                  for (let dx = 0; dx < this.w; dx++) {
                    for (let dy = 0; dy < this.h; dy++) {
                      if (
                        this.game.players[i].x === moveX + dx &&
                        this.game.players[i].y === moveY + dy
                      ) {
                        playerHit = true;
                        break;
                      }
                    }
                    if (playerHit) break;
                  }

                  if (playerHit) {
                    const src = this.closestTileToPoint(
                      this.game.players[i].x,
                      this.game.players[i].y,
                    );
                    if (!this.shouldSkipAttack()) {
                      this.game.players[i].hurt(this.hit(), this.name, {
                        source: { x: src.x, y: src.y },
                      });
                      if (!hitAnything) {
                        this.drawX = 0.5 * (this.x - this.game.players[i].x);
                        this.drawY = 0.5 * (this.y - this.game.players[i].y);
                        if (
                          this.game.players[i] ===
                          this.game.players[this.game.localPlayerID]
                        )
                          this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                        hitAnything = true;
                      }
                    }
                    hitPlayer = true;
                  }
                }
              }
              if (hitPlayer) {
                // Destroy breakable entities in the attack footprint
                for (const e of [...this.room.entities]) {
                  if (
                    e !== this &&
                    e.destroyable &&
                    e.destroyableByOthers
                  ) {
                    for (let dx = 0; dx < this.w; dx++) {
                      for (let dy = 0; dy < this.h; dy++) {
                        if (e.occupiesTile(moveX + dx, moveY + dy, this.z ?? 0)) {
                          e.hurt(this as any, e.health);
                          break;
                        }
                      }
                    }
                  }
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
            // When direction changed (gate fired), direction is already updated above —
            // the enemy spends this turn turning and will move next turn.
          } else {
            this.facePlayer(this.targetPlayer);
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
          this.makeBigHitWarnings();
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
                this.makeBigHitWarnings();
              }
            }
          }
        }
      }
    }
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
    this.tickHealthBarHover();

    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x + 0.5,
      this.y,
      true,
    );
  };

  draw = (delta: number) => {
    if (this.dead) return;
    //this.updateShadeColor(delta);
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;
    if (this.hasShadow) this.drawShadow(delta);
    this.drawMobWithCrush(
      this.tileX, // + Math.floor(this.frame),
      this.tileY + this.direction * 3,
      2,
      3,
      this.x - this.drawX,
      this.y - this.drawYOffset - this.drawY - this.jumpY,
      2,
      3,
      this.softShadeColor,
      this.shadeAmount(),
      undefined,
      this.outlineColor(),
      this.outlineOpacity(),
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
