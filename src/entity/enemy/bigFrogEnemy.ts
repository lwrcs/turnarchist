import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { HitWarning, HitWarningDirection } from "../../drawable/hitWarning";
import { SpikeTrap } from "../../tile/spiketrap";
import { Coin } from "../../item/coin";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";
import { Utils } from "../../utility/utils";
import { DownLadder } from "../../tile/downLadder";
import { Door } from "../../tile/door";
import { GameConstants } from "../../game/gameConstants";

export class BigFrogEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  frameLength: number;
  startFrame: number;
  animationSpeed: number;
  tickCount: number;
  rumbling: boolean;
  jumping: boolean;
  jumpDistance: number;
  halfJumped: boolean;
  static difficulty: number = 1;
  static tileX: number = 37;
  static tileY: number = 24;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 4;
    this.maxHealth = 4;
    this.defaultMaxHealth = 4;
    this.tileX = 37;
    this.tileY = 24;
    this.seenPlayer = false;
    this.aggro = false;
    this.deathParticleColor = "#ffffff";
    this.frameLength = 3;
    this.startFrame = 0;
    this.animationSpeed = 0.1;
    this.tickCount = 0;
    this.jumping = false;
    this.jumpDistance = 1;
    this.drop = drop ? drop : new Coin(this.room, this.x, this.y);
    this.name = "bigfrog";
    this.orthogonalAttack = true;
    this.diagonalAttack = true;
    this.jumpHeight = 2;
    this.imageParticleX = 3;
    this.imageParticleY = 30;
    this.canDestroyOthers = true;
    this.halfJumped = false;
    this.canCrushOthers = true;
    this.dropChance = 1;
    //if (drop) this.drop = drop;
    this.h = 2;
    this.w = 2;
    this.getDrop(["frog"], true);
  }

  hit = (): number => {
    return this.damage;
  };

  poison = () => {};

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.cloned) return;

    this.tileX = 37;
    this.frameLength = 3;
    this.animationSpeed = 0.1;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (!this.seenPlayer) {
        this.tileX = 37;
        this.lookForPlayer();
      } else if (this.seenPlayer) {
        this.tileX = 37;
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);
          this.ticks++;
          if (this.ticks % 2 === 1) {
            this.rumbling = true;
            let oldX = this.x;
            let oldY = this.y;
            let disablePositions = Array<astar.Position>();

            for (const e of this.room.entities) {
              if (e !== this && !e.destroyable) {
                // Block all tiles occupied by entities (supports multi-tile entities)
                for (let ex = 0; ex < (e.w || 1); ex++) {
                  for (let ey = 0; ey < (e.h || 1); ey++) {
                    disablePositions.push({
                      x: e.x + ex,
                      y: e.y + ey,
                    } as astar.Position);
                  }
                }
              }
            }

            // Account for this enemy's 2x2 footprint when avoiding active spike traps
            for (let xx = this.x - 1; xx <= this.x + this.w; xx++) {
              for (let yy = this.y - 1; yy <= this.y + this.h; yy++) {
                if (
                  this.room.roomArray[xx] &&
                  this.room.roomArray[xx][yy] &&
                  this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                  (this.room.roomArray[xx][yy] as SpikeTrap).on
                ) {
                  // don't walk on active spiketraps
                  disablePositions.push({ x: xx, y: yy } as astar.Position);
                }
              }
            }

            let targetPosition = {
              x: this.targetPlayer.x,
              y: this.targetPlayer.y,
            };

            // 2x2-aware jump-over logic
            const px = this.targetPlayer.x;
            const py = this.targetPlayer.y;
            const sharesRow = py >= this.y && py < this.y + this.h;
            const sharesCol = px >= this.x && px < this.x + this.w;

            const isRightAdjacent = sharesRow && px === this.x + this.w; // x + 2
            const isLeftAdjacent = sharesRow && px === this.x - 1;
            const isBelowAdjacent = sharesCol && py === this.y + this.h; // y + 2
            const isAboveAdjacent = sharesCol && py === this.y - 1;

            // Track whether we attempted a jump-over and whether it succeeded
            let triedAdjacentJump = false;
            let performedJump = false;

            const isAreaClear = (
              tx: number,
              ty: number,
              w: number,
              h: number,
            ): boolean => {
              for (let xx = 0; xx < w; xx++) {
                for (let yy = 0; yy < h; yy++) {
                  const ax = tx + xx;
                  const ay = ty + yy;
                  if (!this.room.roomArray[ax] || !this.room.roomArray[ax][ay])
                    return false;
                  const tile = this.room.roomArray[ax][ay];
                  if (
                    tile.isSolid() ||
                    tile.isDoor ||
                    tile instanceof DownLadder
                  )
                    return false;
                  // prevent entity overlap
                  for (const e of this.room.entities) {
                    if (e !== this && !e.destroyable) {
                      if (
                        !(
                          e.x >= tx + w ||
                          e.x + (e.w || 1) <= tx ||
                          e.y >= ty + h ||
                          e.y + (e.h || 1) <= ty
                        )
                      ) {
                        return false;
                      }
                    }
                  }
                }
              }
              return true;
            };

            if (isRightAdjacent) {
              triedAdjacentJump = true;
              const tx = px + 1;
              const ty = this.y;
              if (isAreaClear(tx, ty, this.w, this.h)) {
                this.tryMove(tx, ty);
                this.setDrawXY(oldX, oldY);
                if (this.jumping) {
                  this.frame = 8;
                  this.animationSpeed = 1;
                }
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
                this.rumbling = false;
                performedJump = true;
                return;
              }
            } else if (isLeftAdjacent) {
              triedAdjacentJump = true;
              const tx = px - this.w;
              const ty = this.y;
              if (isAreaClear(tx, ty, this.w, this.h)) {
                this.tryMove(tx, ty);
                this.setDrawXY(oldX, oldY);
                if (this.jumping) {
                  this.frame = 8;
                  this.animationSpeed = 1;
                }
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
                this.rumbling = false;
                performedJump = true;
                return;
              }
            } else if (isBelowAdjacent) {
              triedAdjacentJump = true;
              const tx = this.x;
              const ty = py + 1;
              if (isAreaClear(tx, ty, this.w, this.h)) {
                this.tryMove(tx, ty);
                this.setDrawXY(oldX, oldY);
                if (this.jumping) {
                  this.frame = 8;
                  this.animationSpeed = 1;
                }
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
                this.rumbling = false;
                performedJump = true;
                return;
              }
            } else if (isAboveAdjacent) {
              triedAdjacentJump = true;
              const tx = this.x;
              const ty = py - this.h;
              if (isAreaClear(tx, ty, this.w, this.h)) {
                this.tryMove(tx, ty);
                this.setDrawXY(oldX, oldY);
                if (this.jumping) {
                  this.frame = 8;
                  this.animationSpeed = 1;
                }
                if (this.x > oldX) this.direction = Direction.RIGHT;
                else if (this.x < oldX) this.direction = Direction.LEFT;
                else if (this.y > oldY) this.direction = Direction.DOWN;
                else if (this.y < oldY) this.direction = Direction.UP;
                this.rumbling = false;
                performedJump = true;
                return;
              }
            }
            // If adjacent and attempted to jump but destination was blocked, do nothing this turn
            if (triedAdjacentJump && !performedJump) {
              this.rumbling = false;
              return;
            }
            // Build pathfinding grid only if we didn't jump over
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
              targetPosition,
              disablePositions,
              false,
              false,
              false,
              undefined,
              undefined,
              false,
              this.lastPlayerPos,
            );
            console.log(moves); //DON'T REMOVE THIS

            if (moves[1]) {
              const wouldHit = (
                player: Player,
                moveX: number,
                moveY: number,
              ) => {
                return (
                  player.x >= moveX &&
                  player.x < moveX + this.w &&
                  player.y >= moveY &&
                  player.y < moveY + this.h
                );
              };

              let hitPlayer = false;
              for (const i in this.game.players) {
                if (this.game.rooms[this.game.players[i].levelID] !== this.room)
                  continue;
                if (
                  wouldHit(this.game.players[i], moves[1].pos.x, moves[1].pos.y)
                ) {
                  const closestTile = this.closestTile(this.game.players[i]);
                  this.game.players[i].hurt(this.hit(), this.name);
                  this.drawX += 1.5 * (closestTile.x - this.game.players[i].x);
                  this.drawY += 1.5 * (closestTile.y - this.game.players[i].y);
                  if (
                    this.game.players[i] ===
                    this.game.players[this.game.localPlayerID]
                  )
                    this.game.shakeScreen(5 * this.drawX, 5 * this.drawY);
                  hitPlayer = true;
                }
              }
              if (!hitPlayer) {
                if (moves.length > 1) {
                  let moveX = moves[1].pos.x;
                  let moveY = moves[1].pos.y;
                  this.tryMove(moveX, moveY);
                  this.setDrawXY(oldX, oldY);

                  if (this.jumping) {
                    this.frame = 8;
                    this.animationSpeed = 1;
                  }
                  if (this.x > moveX) this.direction = Direction.RIGHT;
                  else if (this.x < moveX) this.direction = Direction.LEFT;
                  else if (this.y > moveY) this.direction = Direction.DOWN;
                  else if (this.y < moveY) this.direction = Direction.UP;
                }
              }
            }
            this.rumbling = false;
          } else {
            this.makeBigHitWarnings();
            this.rumbling = true;
            this.tileX = 43;
            this.frame = 0;
            this.frameLength = 2;
            this.animationSpeed = 0.2;
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
                  this.makeBigHitWarnings();
                }
              }
            }
          }
        }
      }
    }
  };

  jump = (delta: number) => {
    //console.log(`this.drawX, this.drawY: ${this.drawX}, ${this.drawY}`);
    if (this.jumping && !this.cloned) {
      let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
      if (j >= 1) {
        this.jumpDistance = 2;
      }
      this.jumpY =
        Math.sin((j / (this.jumpDistance + 1)) * Math.PI) * this.jumpHeight;
      if (this.jumpY < 0.01 && this.jumpY > -0.01) {
        this.jumpY = 0;
        this.jumpDistance = 1;
      }
      if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
    }
  };

  bigEnemyShake = () => {
    if (this.w > 1 || this.h > 1) {
      setTimeout(() => {
        this.game.shakeScreen(0 * this.drawX, 5);
      }, 500);
    }
  };

  makeHitWarnings = () => {
    const cullFactor = 0.25;
    const player: Player = this.getPlayer();
    const orthogonal = this.orthogonalAttack;
    const diagonal = this.diagonalAttack;
    const forwardOnly = this.forwardOnlyAttack;
    const direction = this.direction;
    const orthoRange = this.attackRange;
    const diagRange = this.diagonalAttackRange;

    const generateOffsets = (
      isOrthogonal: boolean,
      range: number,
    ): number[][] => {
      const baseOffsets = isOrthogonal
        ? [
            [-2, 0],
            [2, 0],
            [0, -2],
            [0, 2],
          ]
        : [
            [-1, -1],
            [1, 1],
            [1, -1],
            [-1, 1],
          ];
      return baseOffsets.flatMap(([dx, dy]) =>
        Array.from({ length: range }, (_, i) => [(i + 1) * dx, (i + 1) * dy]),
      );
    };

    const directionOffsets = {
      [Direction.LEFT]: [-1, 0],
      [Direction.RIGHT]: [1, 0],
      [Direction.UP]: [0, -1],
      [Direction.DOWN]: [0, 1],
    };

    let offsets: number[][] = [];
    if (forwardOnly) {
      const [dx, dy] = directionOffsets[direction];
      offsets = Array.from({ length: orthoRange }, (_, i) => [
        (i + 1) * dx,
        (i + 1) * dy,
      ]);
    } else {
      if (orthogonal) offsets.push(...generateOffsets(true, orthoRange));
      if (diagonal) offsets.push(...generateOffsets(false, diagRange));
    }

    const warningCoordinates = offsets
      .map(([dx, dy]) => ({
        x: dx,
        y: dy,
        distance: Utils.distance(dx, dy, player.x - this.x, player.y - this.y),
      }))
      .sort((a, b) => a.distance - b.distance);

    const keepCount = Math.ceil(warningCoordinates.length * (1 - cullFactor));
    const culledWarnings = warningCoordinates.slice(0, keepCount);

    culledWarnings.forEach(({ x, y }) => {
      const positions = [
        { x: this.x, y: this.y },
        { x: this.x + 1, y: this.y },
        { x: this.x, y: this.y + 1 },
        { x: this.x + 1, y: this.y + 1 },
      ];
      for (const position of positions) {
        const targetX = position.x + x;
        const targetY = position.y + y;
        if (this.isWithinRoomBounds(targetX, targetY)) {
          const hitWarning = new HitWarning(
            this.game,
            targetX,
            targetY,
            position.x,
            position.y,
            true,
            false,
            this,
          );

          const dir = hitWarning.getPointerDir();
          const ox = position.x - this.x; // 0 or 1
          const oy = position.y - this.y; // 0 or 1

          let allowed: HitWarningDirection[] = [];
          if (ox === 1 && oy === 1) {
            // bottom-right tile: allow only south/east/southeast
            allowed = [
              HitWarningDirection.South,
              HitWarningDirection.East,
              HitWarningDirection.SouthEast,
            ];
          } else if (ox === 1 && oy === 0) {
            // top-right tile: allow north/east/northeast
            allowed = [
              HitWarningDirection.North,
              HitWarningDirection.East,
              HitWarningDirection.NorthEast,
            ];
          } else if (ox === 0 && oy === 1) {
            // bottom-left tile: allow south/west/southwest
            allowed = [
              HitWarningDirection.South,
              HitWarningDirection.West,
              HitWarningDirection.SouthWest,
            ];
          } else {
            // top-left tile: allow north/west/northwest
            allowed = [
              HitWarningDirection.North,
              HitWarningDirection.West,
              HitWarningDirection.NorthWest,
            ];
          }

          if (allowed.includes(dir)) {
            this.room.hitwarnings.push(hitWarning);
          }

          //this.hitWarnings.push(hitWarning);
        }
      }
    });
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;

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
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += this.animationSpeed * delta;
      if (this.frame >= this.frameLength) {
        this.frame = 0;
      }
      let rumbleX = this.rumble(this.rumbling, this.frame).x;
      let rumbleY = this.rumble(this.rumbling, this.frame).y;
      if (this.drawX !== 0 || this.drawY !== 0) {
        this.jumping = true;
      } else {
        this.jumping = false;
      }
      if (this.jumping) {
        if (this.frame < 4) this.frame = 4;
        this.frameLength = 11;
        this.animationSpeed = 0.2;
      } else {
        this.frameLength = 3;
        this.animationSpeed = 0.1;
      }
      if (this.hasShadow) this.drawShadow(delta);
      Game.drawMob(
        this.tileX +
          (this.tileX !== 59 && !this.rumbling && !this.cloned
            ? Math.floor(this.frame)
            : 0) *
            2,
        this.tileY /*+ this.direction * 2,*/,
        2,
        3,
        this.x + rumbleX - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
        2,
        3,
        this.softShadeColor,
        this.shadeAmount(),
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta, 0.5 * GameConstants.TILESIZE);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta, 0.5 * GameConstants.TILESIZE);
      }
    }
    Game.ctx.restore();
  };
}
