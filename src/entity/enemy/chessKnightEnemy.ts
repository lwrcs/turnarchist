import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { HitWarning } from "../../drawable/hitWarning";
import { GameConstants } from "../../game/gameConstants";
import { GameplaySettings } from "../../game/gameplaySettings";
import { Enemy } from "./enemy";
import { Item } from "../../item/item";
import { Utils } from "../../utility/utils";

// Corner turn sprites: [aTileX, aTileY, bTileX, bTileY]
// All 8 A sprites on y=22 (x=16-23), all 8 B sprites directly below on y=23 (x=16-23)
function knightCornerSprite(initDir: Direction, cornerDir: Direction): [number, number, number, number] | null {
  if (initDir === Direction.UP    && cornerDir === Direction.LEFT)  return [16, 22, 16, 23];
  if (initDir === Direction.LEFT  && cornerDir === Direction.DOWN)  return [17, 22, 17, 23];
  if (initDir === Direction.DOWN  && cornerDir === Direction.RIGHT) return [18, 22, 18, 23];
  if (initDir === Direction.RIGHT && cornerDir === Direction.UP)    return [19, 22, 19, 23];
  if (initDir === Direction.DOWN  && cornerDir === Direction.LEFT)  return [20, 22, 20, 23];
  if (initDir === Direction.LEFT  && cornerDir === Direction.UP)    return [21, 22, 21, 23];
  if (initDir === Direction.UP    && cornerDir === Direction.RIGHT) return [22, 22, 22, 23];
  if (initDir === Direction.RIGHT && cornerDir === Direction.DOWN)  return [23, 22, 23, 23];
  return null;
}

class KnightCornerHitWarning extends HitWarning {
  override readonly skipSave: boolean = true;
  private cornerTileX: number;
  private cornerTileY: number;
  private cornerRedTileX: number;
  private cornerRedTileY: number;
  private _alpha: number = 0;
  private _tickedForDeath: boolean = false;
  private _game: Game;

  constructor(
    game: Game,
    x: number,
    y: number,
    initDir: Direction,
    cornerDir: Direction,
    parent: Enemy,
  ) {
    // dirOnly=true so no X marker, eX/eY = tile itself so base draws nothing
    super(game, x, y, x, y, true, true, parent);
    this._game = game;
    const sprite = knightCornerSprite(initDir, cornerDir);
    this.cornerTileX    = sprite ? sprite[0] : -1;
    this.cornerTileY    = sprite ? sprite[1] : -1;
    this.cornerRedTileX = sprite ? sprite[2] : -1;
    this.cornerRedTileY = sprite ? sprite[3] : -1;
  }

  private fadeAlpha(delta: number): void {
    if (!this._tickedForDeath) {
      if (this._alpha < 1) this._alpha = Math.min(1, this._alpha + 0.03 * delta);
    } else {
      if (this._alpha > 0) this._alpha = Math.max(0, this._alpha - 0.03 * delta);
    }
  }

  override draw = (delta: number) => {
    this.fadeAlpha(delta);
    if (this.cornerTileX < 0) return;
    const player = this._game.players[this._game.localPlayerID];
    // Red (close-range) version — mirrors HitWarning.draw() proximity rule
    if (
      Math.abs(this.x - player.x) <= 1 &&
      Math.abs(this.y - player.y) <= 1
    ) {
      const frame = Math.floor(HitWarning.frame);
      const baseAlpha = Game.ctx.globalAlpha;
      Game.ctx.globalAlpha = baseAlpha * this._alpha;
      Game.drawFX(this.cornerRedTileX, this.cornerRedTileY + frame * 4, 1, 1, this.x, this.y - 0.2, 1, 1);
      Game.ctx.globalAlpha = baseAlpha;
    }
  };

  override drawTopLayer = (delta: number) => {
    this.fadeAlpha(delta);
    if (this.cornerTileX < 0) return;
    // Skip A when B is already drawn in draw() — same 1-tile proximity rule
    const player = this._game.players[this._game.localPlayerID];
    if (Math.abs(this.x - player.x) <= 1 && Math.abs(this.y - player.y) <= 1) return;
    const frame = Math.floor(HitWarning.frame);
    const baseAlpha = Game.ctx.globalAlpha;
    Game.ctx.globalAlpha = baseAlpha * this._alpha;
    Game.drawFX(this.cornerTileX, this.cornerTileY + frame * 4, 1, 1, this.x, this.y - 0.2, 1, 1);
    Game.ctx.globalAlpha = baseAlpha;
  };

  override tick = () => {
    if (this._tickedForDeath) this.dead = true;
    this._tickedForDeath = true;
  };
}

// Alternate hitwarning: composites one or two arm sprites onto an offscreen canvas,
// then blits the result at 50% alpha so overlapping halves read as a single shape.
class KnightArmHitWarning extends HitWarning {
  override readonly skipSave: boolean = true;
  private spriteW: number;
  private spriteH: number;
  private spriteDrawX: number;
  private spriteDrawY: number;
  private _alpha: number = 0;
  private _tickedForDeath: boolean = false;
  private _offscreenFrames: HTMLCanvasElement[] = [];
  private _destTiles: { x: number; y: number }[];
  private _game: Game;

  constructor(
    game: Game,
    x: number,
    y: number,
    sprites: { tileX: number; tileY: number }[],
    destTiles: { x: number; y: number }[],
    w: number,
    h: number,
    drawX: number,
    drawY: number,
    clipSide: "top" | "bottom" | "left" | "right",
    parent: Enemy,
  ) {
    super(game, x, y, x, y, true, true, parent);
    // The arm sprite occupies an artificial center position, not a real tile that
    // should gate its visibility. Reset any dead flag set by removeOverlapping.
    this.dead = false;
    this._game = game;
    this._destTiles = destTiles;
    this.spriteW = w;
    this.spriteH = h;
    this.spriteDrawX = drawX;
    this.spriteDrawY = drawY;

    // Pre-composite both animation frames onto separate offscreen canvases.
    // Frame 1 sprites are at tileY+4. If 2 sprites: draw the first fully,
    // then clip the second to its far half only so the stem isn't double-drawn.
    const ts = GameConstants.TILESIZE;
    for (let f = 0; f < 2; f++) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * ts);
      canvas.height = Math.round(h * ts);
      const offCtx = canvas.getContext("2d")!;
      for (let i = 0; i < sprites.length; i++) {
        const sp = sprites[i];
        offCtx.save();
        if (i > 0 && sprites.length > 1) {
          offCtx.beginPath();
          switch (clipSide) {
            case "top":    offCtx.rect(0, 0, Math.round(w * ts), Math.round(h * ts / 2)); break;
            case "bottom": offCtx.rect(0, Math.round(h * ts / 2), Math.round(w * ts), Math.round(h * ts / 2)); break;
            case "left":   offCtx.rect(0, 0, Math.round(w * ts / 2), Math.round(h * ts)); break;
            case "right":  offCtx.rect(Math.round(w * ts / 2), 0, Math.round(w * ts / 2), Math.round(h * ts)); break;
          }
          offCtx.clip();
        }
        offCtx.drawImage(
          Game.fxset,
          Math.round(sp.tileX * ts), Math.round((sp.tileY + f * 4) * ts),
          Math.round(w * ts), Math.round(h * ts),
          0, 0,
          Math.round(w * ts), Math.round(h * ts),
        );
        offCtx.restore();
      }
      this._offscreenFrames.push(canvas);
    }
  }

  private fadeAlpha(delta: number): void {
    if (!this._tickedForDeath) {
      if (this._alpha < 1) this._alpha = Math.min(1, this._alpha + 0.03 * delta);
    } else {
      if (this._alpha > 0) this._alpha = Math.max(0, this._alpha - 0.03 * delta);
    }
  }

  override draw = (_delta: number) => {};

  override drawTopLayer = (delta: number) => {
    this.fadeAlpha(delta);

    // Mirror HitWarning's X proximity fade: full within 1 tile, fades to 0 at 2 tiles.
    // Use the closest destination tile to determine visibility.
    const player = this._game.players[this._game.localPlayerID];
    const playerX = player.x - player.drawX;
    const playerY = player.y - player.drawY;
    let minDist = Infinity;
    for (const dt of this._destTiles) {
      const d = Utils.distance(dt.x, dt.y, playerX, playerY);
      if (d < minDist) minDist = d;
    }
    const fadeStart = 1;
    const fadeEnd = 2;
    let proximityAlpha: number;
    if (minDist <= fadeStart) proximityAlpha = 1;
    else if (minDist >= fadeEnd) proximityAlpha = 0;
    else proximityAlpha = 1 - (minDist - fadeStart) / (fadeEnd - fadeStart);

    if (proximityAlpha <= 0.001) return;

    const ts = GameConstants.TILESIZE;
    const baseAlpha = Game.ctx.globalAlpha;
    Game.ctx.globalAlpha = baseAlpha * this._alpha * 0.5 * proximityAlpha;
    const frame = Math.floor(HitWarning.frame);
    Game.ctx.drawImage(
      this._offscreenFrames[frame],
      Math.round(this.spriteDrawX * ts),
      Math.round(this.spriteDrawY * ts),
    );
    Game.ctx.globalAlpha = baseAlpha;
  };

  override tick = () => {
    if (this._tickedForDeath) this.dead = true;
    this._tickedForDeath = true;
  };
}

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
  knightAttackOutbound: boolean;
  knightAttackTargetX: number;
  knightAttackTargetY: number;
  knightAttackInitDir: Direction;
  knightAttackCornerDir: Direction;
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
    this.knightAttackOutbound = false;
    this.knightAttackTargetX = x;
    this.knightAttackTargetY = y;
    this.knightAttackInitDir = Direction.DOWN;
    this.knightAttackCornerDir = Direction.DOWN;
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
    this.knightAttackOutbound = entry.isAttack;
    if (entry.isAttack) {
      this.knightAttackTargetX = entry.destX;
      this.knightAttackTargetY = entry.destY;
      this.knightAttackInitDir = entry.initDirection;
      this.knightAttackCornerDir = entry.cornerDirection;
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

      // Corner turn sprite at elbow
      if (this.isWithinRoomBounds(elbowX, elbowY)) {
        const initDir = Math.abs(dx) === 2
          ? (dx > 0 ? Direction.RIGHT : Direction.LEFT)
          : (dy > 0 ? Direction.DOWN : Direction.UP);
        const cornerDir = Math.abs(dx) === 2
          ? (dy > 0 ? Direction.DOWN : Direction.UP)
          : (dx > 0 ? Direction.RIGHT : Direction.LEFT);
        this.room.hitwarnings.push(
          new KnightCornerHitWarning(this.game, elbowX, elbowY, initDir, cornerDir, this),
        );
      }
    }
  }

  private makeKnightHitWarningsAlternate(): void {
    const z = this.z ?? 0;
    const can = (tx: number, ty: number) =>
      this.isWithinRoomBounds(tx, ty) && !this.room.isSolidAt(tx, ty, z);

    // Track reachability per individual move
    const downRight = can(this.x + 1, this.y + 2);
    const downLeft  = can(this.x - 1, this.y + 2);
    const upRight   = can(this.x + 1, this.y - 2);
    const upLeft    = can(this.x - 1, this.y - 2);
    const rightDown = can(this.x + 2, this.y + 1);
    const rightUp   = can(this.x + 2, this.y - 1);
    const leftDown  = can(this.x - 2, this.y + 1);
    const leftUp    = can(this.x - 2, this.y - 1);

    // DOWN arm — one instance per reachable destination
    if (downRight) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x, this.y + 2, [{ tileX: 22, tileY: 24 }], [{ x: this.x + 1, y: this.y + 2 }],
      2, 2, this.x - 0.5, this.y + 1, "bottom", this));
    if (downLeft) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x, this.y + 2, [{ tileX: 26, tileY: 24 }], [{ x: this.x - 1, y: this.y + 2 }],
      2, 2, this.x - 0.5, this.y + 1, "bottom", this));

    // UP arm
    if (upRight) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x, this.y - 2, [{ tileX: 24, tileY: 24 }], [{ x: this.x + 1, y: this.y - 2 }],
      2, 2, this.x - 0.5, this.y - 2, "top", this));
    if (upLeft) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x, this.y - 2, [{ tileX: 28, tileY: 24 }], [{ x: this.x - 1, y: this.y - 2 }],
      2, 2, this.x - 0.5, this.y - 2, "top", this));

    // LEFT arm
    if (leftDown) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x - 2, this.y, [{ tileX: 22, tileY: 26 }], [{ x: this.x - 2, y: this.y + 1 }],
      2, 2, this.x - 2, this.y - 0.5, "left", this));
    if (leftUp) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x - 2, this.y, [{ tileX: 26, tileY: 26 }], [{ x: this.x - 2, y: this.y - 1 }],
      2, 2, this.x - 2, this.y - 0.5, "left", this));

    // RIGHT arm
    if (rightUp) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x + 2, this.y, [{ tileX: 24, tileY: 26 }], [{ x: this.x + 2, y: this.y - 1 }],
      2, 2, this.x + 1, this.y - 0.5, "right", this));
    if (rightDown) this.room.hitwarnings.push(new KnightArmHitWarning(
      this.game, this.x + 2, this.y, [{ tileX: 28, tileY: 26 }], [{ x: this.x + 2, y: this.y + 1 }],
      2, 2, this.x + 1, this.y - 0.5, "right", this));

    // X markers only on each reachable destination tile (no arrows)
    for (const [dx, dy] of KNIGHT_MOVES) {
      const tx = this.x + dx;
      const ty = this.y + dy;
      if (!can(tx, ty)) continue;
      this.room.hitwarnings.push(
        new HitWarning(this.game, tx, ty, tx, ty, false, false, this),
      );
    }
  }

  private callHitWarnings(): void {
    if (GameplaySettings.ALTERNATE_CHESS_KNIGHT_HITWARNINGS) {
      this.makeKnightHitWarningsAlternate();
    } else {
      this.makeKnightHitWarnings();
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
      } else {
        if (this.room.playerTicked === this.targetPlayer) {
          this.alertTicks = Math.max(0, this.alertTicks - 1);

          if (this.ticks % 2 === 0) {
            // Warning turn: rumble and show hit warnings
            this.rumbling = true;
            this.unconscious = false;
            this.callHitWarnings();
          } else if (this.ticks % 2 === 1) {
            // Move turn
            this.rumbling = true;
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

            this.rumbling = false;
            this.unconscious = true;
          }
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
      // Speed up aggressively based on queue depth; outbound attack 6×, return 2×, move 1×
      const queueSpeed = 1 + Math.pow(this.knightMoveQueue.length, 2);
      const attackSpeed = this.knightAttackOutbound ? 6 : this.knightAttackAnim ? 2 : 1;
      this.knightAnimProgress = Math.min(
        1,
        this.knightAnimProgress + 0.025 * queueSpeed * attackSpeed * delta,
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
        this.knightAttackOutbound = false;
        const tx = this.knightAttackTargetX;
        const ty = this.knightAttackTargetY;
        const elbowX = this.knightAnimMidX;
        const elbowY = this.knightAnimMidY;
        this.knightAnimStartX = tx;
        this.knightAnimStartY = ty;
        // phase ratio flips: return is short-leg first (1 tile), then long-leg (2 tiles)
        this.knightAnimPhase1End = 1 / 3;
        // Facing mirrors outbound order in reverse: cornerDir first, then initDir
        this.direction = this.knightAttackCornerDir;
        this.knightAnimCornerDirection = this.knightAttackInitDir;
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

    const rumble = this.rumble(this.rumbling, this.frame, this.direction);
    this.drawMobWithCrush(
      this.tileX,
      this.tileY + this.direction * 2,
      1,
      2,
      visualX + rumble.x,
      visualY - this.drawYOffset - visualJumpY + rumble.y,
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
