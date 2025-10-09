import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Utils } from "../../utility/utils";
import { HitWarning } from "../../drawable/hitWarning";

export class BeetleEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 1;
  static tileX: number = 8;
  static tileY: number = 4;
  revealTick: number;
  jumpDistance: number;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 13;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "beetle";
    this.orthogonalAttack = true;
    this.diagonalAttack = false;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    //if (drop) this.drop = drop;
    this.drawYOffset = 1.2;
    this.revealTick = 0;
    this.hasShadow = true;
    this.jumpHeight = 1;
    this.jumpDistance = 1;
    this.attackRange = 1;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Beetle 
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return this.damage;
  };

  toggleReveal = () => {
    let ticksSince = this.ticks - this.revealTick;

    this.revealTick = this.ticks;
  };

  jump = (delta: number) => {
    //console.log(`this.drawX, this.drawY: ${this.drawX}, ${this.drawY}`);
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    if (j > 2) {
      this.jumpDistance = 3;
    } else if (j > 1) {
      this.jumpDistance = 2;
    }
    this.jumpY = Math.sin((j / this.jumpDistance) * Math.PI) * this.jumpHeight;
    if (this.jumpY < 0.01 && this.jumpY > -0.01) {
      this.jumpY = 0;
      this.jumpDistance = 1;
    }
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };

  // Helpers to keep movement logic concise
  private isTileFree = (x: number, y: number): boolean => {
    if (!this.room.roomArray[x] || !this.room.roomArray[x][y]) return false;
    const t = this.room.roomArray[x][y];
    if (t.isSolid()) return false;
    if (t instanceof SpikeTrap && (t as SpikeTrap).on) return false;
    for (const e of this.room.entities) {
      if (e !== this && e.x === x && e.y === y) return false;
    }
    return true;
  };

  private getTwoTileCandidates = (
    startX: number,
    startY: number,
  ): Array<{
    endX: number;
    endY: number;
    axis: "x" | "y";
    dx: number;
    dy: number;
  }> => {
    const directions = [
      { dx: 1, dy: 0, axis: "x" as const },
      { dx: -1, dy: 0, axis: "x" as const },
      { dx: 0, dy: 1, axis: "y" as const },
      { dx: 0, dy: -1, axis: "y" as const },
    ];
    const candidates = [] as Array<{
      endX: number;
      endY: number;
      axis: "x" | "y";
      dx: number;
      dy: number;
    }>;
    for (const d of directions) {
      const midX = startX + d.dx;
      const midY = startY + d.dy;
      const endX = startX + 2 * d.dx;
      const endY = startY + 2 * d.dy;
      if (this.isTileFree(midX, midY) && this.isTileFree(endX, endY)) {
        candidates.push({ endX, endY, axis: d.axis, dx: d.dx, dy: d.dy });
      }
    }
    return candidates;
  };

  private getThreeTileCandidates = (
    startX: number,
    startY: number,
  ): Array<{
    endX: number;
    endY: number;
    axis: "x" | "y";
    dx: number;
    dy: number;
  }> => {
    const directions = [
      { dx: 1, dy: 0, axis: "x" as const },
      { dx: -1, dy: 0, axis: "x" as const },
      { dx: 0, dy: 1, axis: "y" as const },
      { dx: 0, dy: -1, axis: "y" as const },
    ];
    const candidates = [] as Array<{
      endX: number;
      endY: number;
      axis: "x" | "y";
      dx: number;
      dy: number;
    }>;
    for (const d of directions) {
      const mid1X = startX + d.dx;
      const mid1Y = startY + d.dy;
      const mid2X = startX + 2 * d.dx;
      const mid2Y = startY + 2 * d.dy;
      const endX = startX + 3 * d.dx;
      const endY = startY + 3 * d.dy;
      if (
        this.isTileFree(mid1X, mid1Y) &&
        this.isTileFree(mid2X, mid2Y) &&
        this.isTileFree(endX, endY)
      ) {
        candidates.push({ endX, endY, axis: d.axis, dx: d.dx, dy: d.dy });
      }
    }
    return candidates;
  };

  private pickBestCandidate = (
    candidates: Array<{
      endX: number;
      endY: number;
      axis: "x" | "y";
      dx: number;
      dy: number;
    }>,
    targetX: number,
    targetY: number,
    preferXAxis: boolean,
    dxToTarget: number,
    dyToTarget: number,
  ) => {
    const signX = dxToTarget === 0 ? 0 : dxToTarget > 0 ? 1 : -1;
    const signY = dyToTarget === 0 ? 0 : dyToTarget > 0 ? 1 : -1;
    candidates.sort((a, b) => {
      const da = Math.abs(a.endX - targetX) + Math.abs(a.endY - targetY);
      const db = Math.abs(b.endX - targetX) + Math.abs(b.endY - targetY);
      if (da !== db) return da - db;
      if (preferXAxis) {
        if (a.axis !== b.axis) return a.axis === "x" ? -1 : 1;
      } else {
        if (a.axis !== b.axis) return a.axis === "y" ? -1 : 1;
      }
      const aTowards = (a.dx !== 0 ? a.dx === signX : a.dy === signY) ? -1 : 1;
      const bTowards = (b.dx !== 0 ? b.dx === signX : b.dy === signY) ? -1 : 1;
      if (aTowards !== bTowards) return aTowards - bTowards;
      return 0;
    });
    return candidates[0];
  };

  private getOneTileCandidates = (
    startX: number,
    startY: number,
  ): Array<{ x: number; y: number }> => {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];
    const candidates: Array<{ x: number; y: number }> = [];

    for (const d of directions) {
      const newX = startX + d.dx;
      const newY = startY + d.dy;
      if (this.isTileFree(newX, newY)) {
        candidates.push({ x: newX, y: newY });
      }
    }
    return candidates;
  };

  private pickBestOneTileCandidate = (
    candidates: Array<{ x: number; y: number }>,
    targetX: number,
    targetY: number,
    preferXAxis: boolean,
    dxToTarget: number,
    dyToTarget: number,
  ) => {
    const signX = dxToTarget === 0 ? 0 : dxToTarget > 0 ? 1 : -1;
    const signY = dyToTarget === 0 ? 0 : dyToTarget > 0 ? 1 : -1;

    candidates.sort((a, b) => {
      const da = Math.abs(a.x - targetX) + Math.abs(a.y - targetY);
      const db = Math.abs(b.x - targetX) + Math.abs(b.y - targetY);
      if (da !== db) return da - db;

      // Prefer movement along the preferred axis
      const aAxis =
        Math.abs(a.x - targetX) > Math.abs(a.y - targetY) ? "x" : "y";
      const bAxis =
        Math.abs(b.x - targetX) > Math.abs(b.y - targetY) ? "x" : "y";

      if (preferXAxis) {
        if (aAxis !== bAxis) return aAxis === "x" ? -1 : 1;
      } else {
        if (aAxis !== bAxis) return aAxis === "y" ? -1 : 1;
      }

      // Prefer moving toward the target
      const aTowards = (
        a.x > targetX
          ? dxToTarget < 0
          : a.x < targetX
            ? dxToTarget > 0
            : a.y > targetY
              ? dyToTarget < 0
              : a.y < targetY
                ? dyToTarget > 0
                : 0
      )
        ? -1
        : 1;
      const bTowards = (
        b.x > targetX
          ? dxToTarget < 0
          : b.x < targetX
            ? dxToTarget > 0
            : b.y > targetY
              ? dyToTarget < 0
              : b.y < targetY
                ? dyToTarget > 0
                : 0
      )
        ? -1
        : 1;
      if (aTowards !== bTowards) return aTowards - bTowards;

      return 0;
    });
    return candidates[0];
  };

  private attackOrMoveTo = (
    destX: number,
    destY: number,
    oldX: number,
    oldY: number,
  ): void => {
    const stepDist = Math.abs(destX - oldX) + Math.abs(destY - oldY);
    let hitPlayer = false;
    for (const i in this.game.players) {
      if (
        this.game.rooms[this.game.players[i].levelID] === this.room &&
        this.game.players[i].x === destX &&
        this.game.players[i].y === destY
      ) {
        // Only allow attacks when moving 2-3 tiles in a single action
        if (stepDist >= 2 && stepDist <= 3) {
          this.game.players[i].hurt(this.hit(), this.name);
          this.drawX = 0.5 * (this.x - this.game.players[i].x);
          this.drawY = 0.5 * (this.y - this.game.players[i].y);
          if (
            this.game.players[i] === this.game.players[this.game.localPlayerID]
          )
            this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
        }
        hitPlayer = true;
      }
    }
    if (!hitPlayer) {
      this.tryMove(destX, destY);
      this.setDrawXY(oldX, oldY);
      if (this.x > oldX) this.direction = Direction.RIGHT;
      else if (this.x < oldX) this.direction = Direction.LEFT;
      else if (this.y > oldY) this.direction = Direction.DOWN;
      else if (this.y < oldY) this.direction = Direction.UP;
    }
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
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
            this.target =
              this.getAverageLuminance() > 0
                ? this.targetPlayer
                : this.room.getExtremeLuminanceFromPoint(this.x, this.y)
                    .darkest;

            // Determine target position: prioritize direct attack if player is adjacent
            let targetPosition = {
              x: this.targetPlayer.x,
              y: this.targetPlayer.y,
            };

            // Check player Manhattan distance
            const playerDistance =
              Math.abs(this.targetPlayer.x - this.x) +
              Math.abs(this.targetPlayer.y - this.y);

            if (this.target === this.targetPlayer && playerDistance === 2) {
              // Only consider jumping over if player is not adjacent
              let dx = this.targetPlayer.lastX - this.x;
              let dy = this.targetPlayer.lastY - this.y;
              // constrain to orthogonal intent
              if (dx !== 0 && dy !== 0) {
                if (Math.abs(dx) >= Math.abs(dy)) dy = 0;
                else dx = 0;
              }
              if (
                (dx === 0 && Math.abs(dy) <= 1) ||
                (dy === 0 && Math.abs(dx) <= 1)
              ) {
                const jumpOverX = this.targetPlayer.x + Math.sign(dx);
                const jumpOverY = this.targetPlayer.y + Math.sign(dy);
                if (
                  this.room.roomArray[jumpOverX] &&
                  this.room.roomArray[jumpOverX][jumpOverY] &&
                  !this.room.roomArray[jumpOverX][jumpOverY].isSolid()
                ) {
                  targetPosition = { x: jumpOverX, y: jumpOverY };
                }
              }
            } else if (this.target !== this.targetPlayer) {
              targetPosition = { x: this.target.x, y: this.target.y } as any;
            }

            // Compute 2-tile jump plans
            const dxToTarget = targetPosition.x - oldX;
            const dyToTarget = targetPosition.y - oldY;
            const preferXAxis = Math.abs(dxToTarget) >= Math.abs(dyToTarget);

            // First, try to use A* first/second step and extend up to length 3 if possible
            let finalX = this.x;
            let finalY = this.y;
            const moves = astar.AStar.search(
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
            if (moves.length > 0) {
              let step = moves[0];
              const candidate2 = moves[1];
              const candidate3 = moves[2];
              if (candidate3) {
                const preservesLine3 =
                  candidate3.pos.x === oldX || candidate3.pos.y === oldY;
                const alignsAxis3 = preferXAxis
                  ? candidate3.pos.y === oldY
                  : candidate3.pos.x === oldX;
                if (preservesLine3 && alignsAxis3) step = candidate3;
              } else if (candidate2) {
                const preservesLine2 =
                  candidate2.pos.x === oldX || candidate2.pos.y === oldY;
                const alignsAxis2 = preferXAxis
                  ? candidate2.pos.y === oldY
                  : candidate2.pos.x === oldX;
                if (preservesLine2 && alignsAxis2) step = candidate2;
              }
              finalX = step.pos.x;
              finalY = step.pos.y;
              const manhattanFromStart =
                Math.abs(finalX - oldX) + Math.abs(finalY - oldY);
              if (manhattanFromStart === 1 || manhattanFromStart === 2) {
                const dirX = finalX - oldX;
                const dirY = finalY - oldY;
                const stepX = dirX !== 0 ? Math.sign(dirX) : 0;
                const stepY = dirY !== 0 ? Math.sign(dirY) : 0;
                const extX = finalX + stepX;
                const extY = finalY + stepY;
                if (this.isTileFree(extX, extY)) {
                  finalX = extX;
                  finalY = extY;
                }
              }
            }

            // Execute movement: avoid 1-tile attack; prefer 2-3 range
            if (playerDistance <= 1) {
              // If too close, try to reposition using 2-tile jump plan or fallback
              const finalDist =
                Math.abs(finalX - oldX) + Math.abs(finalY - oldY);
              if (finalDist >= 2) {
                this.attackOrMoveTo(finalX, finalY, oldX, oldY);
              } else {
                const candidates = this.getTwoTileCandidates(oldX, oldY);
                if (candidates.length > 0) {
                  const best = this.pickBestCandidate(
                    candidates,
                    targetPosition.x,
                    targetPosition.y,
                    preferXAxis,
                    dxToTarget,
                    dyToTarget,
                  );
                  this.attackOrMoveTo(best.endX, best.endY, oldX, oldY);
                } else {
                  // last resort, move 1 tile but won't be able to attack
                  const oneTileCandidates = this.getOneTileCandidates(
                    oldX,
                    oldY,
                  );
                  if (oneTileCandidates.length > 0) {
                    const best = this.pickBestOneTileCandidate(
                      oneTileCandidates,
                      targetPosition.x,
                      targetPosition.y,
                      preferXAxis,
                      dxToTarget,
                      dyToTarget,
                    );
                    this.attackOrMoveTo(best.x, best.y, oldX, oldY);
                  }
                }
              }
            } else {
              // Player is not adjacent - use computed movement (A* + extension up to 3 tiles)
              const finalDist =
                Math.abs(finalX - oldX) + Math.abs(finalY - oldY);
              if (finalDist >= 1) {
                this.attackOrMoveTo(finalX, finalY, oldX, oldY);
              } else {
                // Fall back to 3-tile or 2-tile jump candidates if A* didn't find a path
                const candidates3 = this.getThreeTileCandidates(oldX, oldY);
                if (candidates3.length > 0) {
                  const best = this.pickBestCandidate(
                    candidates3,
                    targetPosition.x,
                    targetPosition.y,
                    preferXAxis,
                    dxToTarget,
                    dyToTarget,
                  );
                  this.attackOrMoveTo(best.endX, best.endY, oldX, oldY);
                } else {
                  const candidates2 = this.getTwoTileCandidates(oldX, oldY);
                  if (candidates2.length > 0) {
                    const best = this.pickBestCandidate(
                      candidates2,
                      targetPosition.x,
                      targetPosition.y,
                      preferXAxis,
                      dxToTarget,
                      dyToTarget,
                    );
                    this.attackOrMoveTo(best.endX, best.endY, oldX, oldY);
                  } else {
                    // Fall back to 1-tile movement if no longer jumps available
                    const oneTileCandidates = this.getOneTileCandidates(
                      oldX,
                      oldY,
                    );
                    if (oneTileCandidates.length > 0) {
                      const best = this.pickBestOneTileCandidate(
                        oneTileCandidates,
                        targetPosition.x,
                        targetPosition.y,
                        preferXAxis,
                        dxToTarget,
                        dyToTarget,
                      );
                      this.attackOrMoveTo(best.x, best.y, oldX, oldY);
                    }
                  }
                }
              }
            }
            this.rumbling = false;
          } else {
            this.rumbling = true;
            /*
            if (
              (this.target.x === this.targetPlayer.x &&
                this.target.y === this.targetPlayer.y) ||
              Utils.distance(
                this.targetPlayer.x,
                this.targetPlayer.y,
                this.x,
                this.y,
              ) <= 2
            )
              */ {
              this.makeHitWarnings();
            }
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
                  /*
                  if (
                    (this.target.x === this.targetPlayer.x &&
                      this.target.y === this.targetPlayer.y) ||
                    Utils.distance(
                      this.targetPlayer.x,
                      this.targetPlayer.y,
                      this.x,
                      this.y,
                    ) <= 2
                  ) */ {
                    this.makeHitWarnings();
                  }
                }
              }
            }
          }
        }
      }
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
            [-3, 0],
            [3, 0],
            [0, -3],
            [0, 3],
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
      const targetX = this.x + x;
      const targetY = this.y + y;
      if (this.isWithinRoomBounds(targetX, targetY)) {
        const hitWarning = new HitWarning(
          this.game,
          targetX,
          targetY,
          this.x,
          this.y,
          true,
          false,
          this,
        );
        this.room.hitwarnings.push(hitWarning);
        //this.hitWarnings.push(hitWarning);
      }
    });
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    if (!this.dead) {
      this.updateDrawXY(delta);
      if (this.ticks % 2 === 0) {
        this.tileX = 13;
        this.tileY = 4;
      } else {
        this.tileX = 13;
        this.tileY = 4;
      }
      switch (this.direction) {
        case Direction.UP:
          //this.tileX = 13;
          break;
        case Direction.LEFT:
          //this.tileX = 13;
          //this.tileY = 6;
          break;
        case Direction.RIGHT:
          //this.tileY = 6;
          break;
      }
      let rumble = Math.max(
        this.rumble(this.rumbling, this.frame, this.direction).x,
        Math.max(this.rumble(this.rumbling, this.frame, this.direction).y),
      );
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      if (this.hasShadow) this.drawShadow(delta);
      //only draw when visible
      Game.drawMob(
        this.tileX,
        this.tileY, // + this.direction,
        2,
        2,
        this.x - this.drawX + rumble - 0.5,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
        2 * this.crushX,
        2 * this.crushY,
        this.softShadeColor,
        this.shadeAmount(),
      );

      if (this.crushed) {
        this.crushAnim(delta);
      }
    }
    if (!this.cloned) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta, 0, 0.75 * GameConstants.TILESIZE);
      }
    }
    Game.ctx.restore();
  };
}
