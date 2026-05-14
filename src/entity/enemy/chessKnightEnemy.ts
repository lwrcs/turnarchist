import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { HitWarning } from "../../drawable/hitWarning";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Item } from "../../item/item";

const KNIGHT_MOVES: [number, number][] = [
  [-2, -1],
  [-2, 1],
  [-1, -2],
  [-1, 2],
  [1, -2],
  [1, 2],
  [2, -1],
  [2, 1],
];

interface KnightMoveEntry {
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  destX: number;
  destY: number;
  initDirection: Direction;
  cornerDirection: Direction;
  phase1End: number;
  isAttack: boolean;
}

export class ChessKnightEnemy extends Enemy {
  frame: number;
  ticks: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  knightAnimProgress: number;
  knightAnimStartX: number;
  knightAnimStartY: number;
  knightAnimMidX: number;
  knightAnimMidY: number;
  knightAnimDestX: number;
  knightAnimDestY: number;
  knightAnimCornerDirection: Direction;
  knightAnimPhase1End: number;
  knightAttackAnim: boolean;
  knightAttackTargetX: number;
  knightAttackTargetY: number;
  knightMoveQueue: KnightMoveEntry[];
  static difficulty: number = 3;
  static tileX: number = 39;
  static tileY: number = 8;
  static examineText =
    "A chess knight. Moves in an L-shape — two forward, one aside.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 2;
    this.maxHealth = 2;
    this.defaultMaxHealth = 2;
    this.tileX = 39;
    this.tileY = 8;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "chess knight";
    this.deathParticleColor = "#cc4444";
    this.hasShadow = true;
    this.jumpHeight = 0.8;
    this.drawYOffset = 1.3;
    this.knightAnimProgress = 1;
    this.knightAnimStartX = x;
    this.knightAnimStartY = y;
    this.knightAnimMidX = x;
    this.knightAnimMidY = y;
    this.knightAnimDestX = x;
    this.knightAnimDestY = y;
    this.knightAnimCornerDirection = Direction.DOWN;
    this.knightAnimPhase1End = 2 / 3;
    this.knightAttackAnim = false;
    this.knightAttackTargetX = x;
    this.knightAttackTargetY = y;
    this.knightMoveQueue = [];
    this.imageParticleX = 3;
    this.imageParticleY = 29;
    this.extendShadow = true;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);
  }

  hit = (): number => {
    return this.damage;
  };

  private isValidKnightDest(nx: number, ny: number): boolean {
    if (!this.room.roomArray[nx] || !this.room.roomArray[nx][ny]) return false;
    if (this.room.isSolidAt(nx, ny, this.z ?? 0)) return false;
    for (const e of this.room.entities) {
      if (e !== this && e.x === nx && e.y === ny) return false;
    }
    return true;
  }

  private searchKnightPath(): { x: number; y: number } | null {
    const target = this.targetPlayer;
    if (!target) return null;

    const tx = target.x;
    const ty = target.y;

    type Node = {
      x: number;
      y: number;
      g: number;
      f: number;
      firstX: number;
      firstY: number;
    };

    const open: Node[] = [];
    const closed = new Set<number>();
    const encode = (x: number, y: number) => x * 10000 + y;
    const heuristic = (x: number, y: number) =>
      Math.ceil(Math.max(Math.abs(x - tx), Math.abs(y - ty)) / 2);

    const insert = (node: Node) => {
      let i = open.length;
      open.push(node);
      while (i > 0) {
        const parent = (i - 1) >> 1;
        if (open[parent].f <= open[i].f) break;
        const tmp = open[parent];
        open[parent] = open[i];
        open[i] = tmp;
        i = parent;
      }
    };

    const pop = (): Node | undefined => {
      if (open.length === 0) return undefined;
      const top = open[0];
      const last = open.pop()!;
      if (open.length > 0) {
        open[0] = last;
        let i = 0;
        while (true) {
          const l = 2 * i + 1;
          const r = 2 * i + 2;
          let smallest = i;
          if (l < open.length && open[l].f < open[smallest].f) smallest = l;
          if (r < open.length && open[r].f < open[smallest].f) smallest = r;
          if (smallest === i) break;
          const tmp = open[i];
          open[i] = open[smallest];
          open[smallest] = tmp;
          i = smallest;
        }
      }
      return top;
    };

    insert({
      x: this.x,
      y: this.y,
      g: 0,
      f: heuristic(this.x, this.y),
      firstX: -1,
      firstY: -1,
    });
    let expanded = 0;

    while (open.length > 0 && expanded < 300) {
      const curr = pop()!;
      expanded++;

      const key = encode(curr.x, curr.y);
      if (closed.has(key)) continue;
      closed.add(key);

      if (curr.x === tx && curr.y === ty) {
        return { x: curr.firstX, y: curr.firstY };
      }

      for (const [dx, dy] of KNIGHT_MOVES) {
        const nx = curr.x + dx;
        const ny = curr.y + dy;
        const nk = encode(nx, ny);
        if (closed.has(nk)) continue;

        const isTarget = nx === tx && ny === ty;
        if (!isTarget && !this.isValidKnightDest(nx, ny)) continue;

        const g = curr.g + 1;
        const firstX = curr.firstX === -1 ? nx : curr.firstX;
        const firstY = curr.firstY === -1 ? ny : curr.firstY;
        insert({ x: nx, y: ny, g, f: g + heuristic(nx, ny), firstX, firstY });
      }
    }

    return this.findGreedyKnightMove();
  }

  private findGreedyKnightMove(): { x: number; y: number } | null {
    const target = this.targetPlayer;
    if (!target) return null;

    let bestDist = Infinity;
    let bestPos: { x: number; y: number } | null = null;

    for (const [dx, dy] of KNIGHT_MOVES) {
      const nx = this.x + dx;
      const ny = this.y + dy;
      const isTarget = nx === target.x && ny === target.y;
      if (!isTarget && !this.isValidKnightDest(nx, ny)) continue;
      const dist = Math.abs(nx - target.x) + Math.abs(ny - target.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestPos = { x: nx, y: ny };
      }
    }

    return bestPos;
  }

  private buildMoveEntry(
    destX: number,
    destY: number,
    isAttack: boolean,
  ): KnightMoveEntry {
    const dx = destX - this.x;
    const dy = destY - this.y;
    let midX: number, midY: number, initDir: Direction, cornerDir: Direction;

    if (Math.abs(dx) === 2) {
      midX = this.x + dx;
      midY = this.y;
      initDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
      cornerDir = dy > 0 ? Direction.DOWN : Direction.UP;
    } else {
      midX = this.x;
      midY = this.y + dy;
      initDir = dy > 0 ? Direction.DOWN : Direction.UP;
      cornerDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
    }

    return {
      startX: this.x,
      startY: this.y,
      midX,
      midY,
      destX,
      destY,
      initDirection: initDir,
      cornerDirection: cornerDir,
      phase1End: 2 / 3,
      isAttack,
    };
  }

  private applyMoveEntry(entry: KnightMoveEntry): void {
    this.knightAnimStartX = entry.startX;
    this.knightAnimStartY = entry.startY;
    this.knightAnimMidX = entry.midX;
    this.knightAnimMidY = entry.midY;
    this.knightAnimDestX = entry.destX;
    this.knightAnimDestY = entry.destY;
    this.direction = entry.initDirection;
    this.knightAnimCornerDirection = entry.cornerDirection;
    this.knightAnimPhase1End = entry.phase1End;
    this.knightAttackAnim = entry.isAttack;
    if (entry.isAttack) {
      this.knightAttackTargetX = entry.destX;
      this.knightAttackTargetY = entry.destY;
    }
    this.knightAnimProgress = 0;
  }

  private initKnightAnim(
    destX: number,
    destY: number,
    isAttack: boolean = false,
  ): void {
    const entry = this.buildMoveEntry(destX, destY, isAttack);
    const busy = this.knightAnimProgress < 1 || this.knightAttackAnim;
    if (!busy && this.knightMoveQueue.length === 0) {
      this.applyMoveEntry(entry);
    } else {
      this.knightMoveQueue.push(entry);
    }
  }

  private makeKnightHitWarnings(): void {
    for (const [dx, dy] of KNIGHT_MOVES) {
      const tx = this.x + dx;
      const ty = this.y + dy;
      if (!this.isWithinRoomBounds(tx, ty)) continue;
      if (this.room.isSolidAt(tx, ty, this.z ?? 0)) continue;

      // Elbow of the L: long leg first (matching initKnightAnim)
      const elbowX = Math.abs(dx) === 2 ? this.x + dx : this.x;
      const elbowY = Math.abs(dx) === 2 ? this.y : this.y + dy;

      // First step along long leg (adjacent to knight)
      const step1X = Math.abs(dx) === 2 ? this.x + Math.sign(dx) : this.x;
      const step1Y = Math.abs(dx) === 2 ? this.y : this.y + Math.sign(dy);
      if (this.isWithinRoomBounds(step1X, step1Y)) {
        this.room.hitwarnings.push(
          new HitWarning(
            this.game,
            step1X,
            step1Y,
            this.x,
            this.y,
            true,
            true,
            this,
          ),
        );
      }

      // Arrow at elbow pointing from knight along long leg (no X marker)
      if (this.isWithinRoomBounds(elbowX, elbowY)) {
        this.room.hitwarnings.push(
          new HitWarning(
            this.game,
            elbowX,
            elbowY,
            this.x,
            this.y,
            true,
            true,
            this,
          ),
        );
      }

      // Arrow at destination pointing from elbow along short leg (with X marker)
      this.room.hitwarnings.push(
        new HitWarning(this.game, tx, ty, elbowX, elbowY, true, false, this),
      );
    }
  }

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    if (!this.dead) {
      if (this.handleSkipTurns()) return;

      this.ticks++;

      if (!this.seenPlayer) {
        this.lookForPlayer();
        if (this.seenPlayer) this.makeKnightHitWarnings();
      } else {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);

          const move = this.searchKnightPath();

          if (move !== null) {
            const moveX = move.x;
            const moveY = move.y;

            let hitPlayer = false;
            let hitAnything = false;
            for (const i in this.game.players) {
              const p = this.game.players[i];
              if (
                this.game.rooms[p.levelID] === this.room &&
                p.x === moveX &&
                p.y === moveY
              ) {
                if (!this.shouldSkipAttack()) {
                  p.hurt(this.hit(), this.name, {
                    source: { x: this.x, y: this.y },
                  });
                  if (!hitAnything) {
                    this.initKnightAnim(moveX, moveY, true);
                    if (p === this.game.players[this.game.localPlayerID])
                      this.game.shakeScreen(
                        8 * (this.x - moveX),
                        8 * (this.y - moveY),
                      );
                    hitAnything = true;
                  }
                }
                hitPlayer = true;
              }
            }

            if (!hitPlayer) {
              this.initKnightAnim(moveX, moveY, false);
              this.x = moveX;
              this.y = moveY;
            }
          }

          this.makeKnightHitWarnings();
        }

        let targetPlayerOffline =
          Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !==
          -1;
        if (!this.aggro || targetPlayerOffline) {
          const p = this.nearestPlayer();
          if (p !== false) {
            const [distance, player] = p;
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
                this.makeKnightHitWarnings();
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

    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;

    let visualX: number;
    let visualY: number;
    let visualJumpY: number;

    if (this.knightAnimProgress < 1) {
      // Speed up aggressively based on queue depth
      const queueSpeed = 1 + Math.pow(this.knightMoveQueue.length, 2);
      this.knightAnimProgress = Math.min(
        1,
        this.knightAnimProgress + 0.025 * queueSpeed * delta,
      );
      const prog = this.knightAnimProgress;
      const phase1End = this.knightAnimPhase1End;
      // single cubic ease-in-out over the whole hop
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const eased = ease(prog);

      // quadratic bezier through start → elbow → dest for a slight corner cut
      const bx = this.knightAnimStartX;
      const by = this.knightAnimStartY;
      const cx = this.knightAnimMidX;
      const cy = this.knightAnimMidY;
      const dx = this.knightAnimDestX;
      const dy = this.knightAnimDestY;
      visualX = (1 - eased) * (1 - eased) * bx + 2 * (1 - eased) * eased * cx + eased * eased * dx;
      visualY = (1 - eased) * (1 - eased) * by + 2 * (1 - eased) * eased * cy + eased * eased * dy;

      // direction change at the phase boundary
      if (prog >= phase1End * 0.75) this.direction = this.knightAnimCornerDirection;

      visualJumpY = Math.sin(prog * Math.PI) * this.jumpHeight;

      // Outbound attack anim complete — start return trip
      if (this.knightAttackAnim && this.knightAnimProgress >= 1) {
        this.knightAttackAnim = false;
        const tx = this.knightAttackTargetX;
        const ty = this.knightAttackTargetY;
        const elbowX = this.knightAnimMidX;
        const elbowY = this.knightAnimMidY;
        this.knightAnimStartX = tx;
        this.knightAnimStartY = ty;
        // phase ratio flips: return is short-leg first (1 tile), then long-leg (2 tiles)
        this.knightAnimPhase1End = 1 / 3;
        const dx1 = elbowX - tx;
        const dy1 = elbowY - ty;
        this.direction =
          dx1 !== 0
            ? dx1 > 0
              ? Direction.RIGHT
              : Direction.LEFT
            : dy1 > 0
              ? Direction.DOWN
              : Direction.UP;
        const dx2 = this.x - elbowX;
        const dy2 = this.y - elbowY;
        this.knightAnimCornerDirection =
          dx2 !== 0
            ? dx2 > 0
              ? Direction.RIGHT
              : Direction.LEFT
            : dy2 > 0
              ? Direction.DOWN
              : Direction.UP;
        this.knightAnimDestX = this.x;
        this.knightAnimDestY = this.y;
        this.knightAnimProgress = 0;
      }
    } else {
      // Animation complete — pop next queued move if any
      if (this.knightMoveQueue.length > 0) {
        this.applyMoveEntry(this.knightMoveQueue.shift()!);
        // Draw at start position for this frame
        visualX = this.knightAnimStartX;
        visualY = this.knightAnimStartY;
        visualJumpY = 0;
      } else {
        this.updateDrawXY(delta);
        visualX = this.x - this.drawX;
        visualY = this.y - this.drawY;
        visualJumpY = 0;
      }
    }

    if (this.hasShadow) {
      this.extendShadow = visualJumpY < 0.2 ? true : false;
      const savedDrawX = this.drawX;
      const savedDrawY = this.drawY;
      this.drawX = this.x - visualX;
      this.drawY = this.y - visualY;
      this.drawShadow(delta);
      this.drawX = savedDrawX;
      this.drawY = savedDrawY;
    }

    this.drawMobWithCrush(
      this.tileX,
      this.tileY + this.direction * 2,
      1,
      2,
      visualX,
      visualY - this.drawYOffset - visualJumpY,
      1,
      2,
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

    Game.ctx.restore();
  };

  drawTopLayer = (delta: number) => {
    this.drawableY = this.y;
    this.tickHealthBarHover();
    this.healthBar.draw(
      delta,
      this.health,
      this.maxHealth,
      this.x,
      this.y,
      true,
    );
  };
}
