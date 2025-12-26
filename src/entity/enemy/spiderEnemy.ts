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

enum SpiderState {
  VISIBLE,
  HIDING,
  HIDDEN,
}

export class SpiderEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  static difficulty: number = 1;
  static tileX: number = 8;
  static tileY: number = 4;
  state: SpiderState;
  revealTick: number;
  jumpDistance: number;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 11;
    this.tileY = 4;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "spider";
    this.orthogonalAttack = true;
    this.diagonalAttack = false;
    this.imageParticleX = 3;
    this.imageParticleY = 24;
    this.state = SpiderState.VISIBLE;
    //if (drop) this.drop = drop;
    this.drawYOffset = 1.2;
    this.revealTick = 0;
    this.hasShadow = true;
    this.jumpHeight = 1;
    this.jumpDistance = 1;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  get alertText() {
    return `New Enemy Spotted: Spider 
    Health: ${this.health}
    Attack Pattern: Omnidirectional
    Moves every other turn`;
  }

  hit = (): number => {
    return this.damage;
  };

  toggleReveal = () => {
    let ticksSince = this.ticks - this.revealTick;
    if (this.state === SpiderState.HIDDEN && ticksSince > 8)
      this.state = SpiderState.HIDING;
    this.revealTick = this.ticks;
  };

  jump = (delta: number) => {
    //console.log(`this.drawX, this.drawY: ${this.drawX}, ${this.drawY}`);
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    if (j > 1) {
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
    let hitPlayer = false;
    for (const i in this.game.players) {
      if (
        this.game.rooms[this.game.players[i].levelID] === this.room &&
        this.game.players[i].x === destX &&
        this.game.players[i].y === destY
      ) {
        this.game.players[i].hurt(this.hit(), this.name, {
          source: { x: this.x, y: this.y },
        });
        this.drawX = 0.5 * (this.x - this.game.players[i].x);
        this.drawY = 0.5 * (this.y - this.game.players[i].y);
        if (this.game.players[i] === this.game.players[this.game.localPlayerID])
          this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
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
      this.rumbling = this.ticks % 2 === 1;
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

            // Use localized pathfinding for performance
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

            // Check if player is adjacent (Manhattan distance 1)
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

            // First, try to use A* first/second step and extend to length 2 if possible
            let finalX = this.x;
            let finalY = this.y;
            const moves = this.searchPathLocalized(
              targetPosition,
              disablePositions,
              { useLastPlayerPos: true, allowOmni: false },
            );
            if (moves.length > 0) {
              let step = moves[0];
              const candidate2 = moves[1];
              if (candidate2) {
                const preservesLine =
                  candidate2.pos.x === oldX || candidate2.pos.y === oldY;
                const alignsAxis = preferXAxis
                  ? candidate2.pos.y === oldY
                  : candidate2.pos.x === oldX;
                if (preservesLine && alignsAxis) step = candidate2;
              }
              finalX = step.pos.x;
              finalY = step.pos.y;
              const manhattanFromStart =
                Math.abs(finalX - oldX) + Math.abs(finalY - oldY);
              if (manhattanFromStart === 1) {
                const dirX = finalX - oldX;
                const dirY = finalY - oldY;
                const extX = finalX + (dirX !== 0 ? Math.sign(dirX) : 0);
                const extY = finalY + (dirY !== 0 ? Math.sign(dirY) : 0);
                if (this.isTileFree(extX, extY)) {
                  finalX = extX;
                  finalY = extY;
                }
              }
            }

            // Execute movement: prioritize attacking when adjacent, otherwise prefer 2-tile jumps
            if (playerDistance === 1) {
              // Player is adjacent - prioritize 1-tile movement for direct attack
              const oneTileCandidates = this.getOneTileCandidates(oldX, oldY);
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
            } else {
              // Player is not adjacent - use computed movement (A* + 2-tile extension)
              const finalDist =
                Math.abs(finalX - oldX) + Math.abs(finalY - oldY);
              if (finalDist >= 1) {
                this.attackOrMoveTo(finalX, finalY, oldX, oldY);
              } else {
                // Fall back to 2-tile jump candidates if A* didn't find a path
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
                  // Fall back to 1-tile movement if no 2-tile options available
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
            this.rumbling = false;
            this.unconscious = true;
          } else {
            this.rumbling = true;
            this.unconscious = false;
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

  makeHitWarnings = () => {
    if (this.unconscious) return;
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
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
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
        this.tileX = 11;
        this.tileY = 4;
      } else {
        this.tileX = 11;
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
      if (this.state === SpiderState.VISIBLE) {
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
          undefined,
          this.outlineColor(),
          this.outlineOpacity(),
        );
      }
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
