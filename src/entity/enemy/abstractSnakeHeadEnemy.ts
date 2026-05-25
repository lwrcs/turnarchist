import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { GameConstants } from "../../game/gameConstants";
import { Enemy } from "./enemy";
import { Entity } from "../entity";
import { SnakeSegmentEnemy } from "./snakeSegmentEnemy";
import { pickHeadSprite, snakeDirTo, SNAKE_SPRITES } from "./snakeSprites";
import { BeamEffect, BeamGuideNode } from "../../projectile/beamEffect";

export class AbstractSnakeHeadEnemy extends Enemy {
  ticks: number;
  frame: number;
  seenPlayer: boolean;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  segments: SnakeSegmentEnemy[];
  defaultSegmentCount: number = 6;
  beam: BeamEffect | null = null;

  /** When true, the beam renders alternating darker stripe bands. */
  hasStripes: boolean = true;
  /** Pathfinding movement constraint for this snake-like entity. */
  movementMode: "orthogonal" | "diagonal" | "omni" = "orthogonal";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.frame = 0;
    this.health = 5;
    this.maxHealth = 5;
    this.defaultMaxHealth = 5;
    this.tileX = 41;
    this.tileY = 17;
    this.seenPlayer = false;
    this.aggro = false;
    this.name = "snake";
    this.baseDamage = 1;
    this.orthogonalAttack = true;
    this.pushable = false;
    this.chainPushable = false;
    this.imageParticleX = 3;
    this.imageParticleY = 30;
    this.segments = [];
    this.hasShadow = false;
    this.drawYOffset = 0;

    if (drop) this.drop = drop;
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin"]);

    if (
      !(this.constructor as any).__isCloning &&
      !(this.constructor as any).__skipChainSpawn
    ) {
      this.spawnChain();
    }
  }

  /**
   * Spawn body segments in a trailing line. Stops at the first blocked tile.
   * Called from the constructor for fresh spawns; on load, the chain is rebuilt
   * by the loadV2 post-pass (segments restored independently, then re-linked).
   */
  spawnChain = () => {
    const dx = -1;
    const dy = 0;
    let prev: Enemy = this;
    for (let i = 0; i < this.defaultSegmentCount; i++) {
      const sx = this.x + dx * (i + 1);
      const sy = this.y + dy * (i + 1);
      const seg = SnakeSegmentEnemy.add(
        this.room,
        this.game,
        sx,
        sy,
        this,
        prev,
        i,
      );
      if (!seg) break;
      this.segments.push(seg as SnakeSegmentEnemy);
      prev = seg as SnakeSegmentEnemy;
    }
  };

  /** Subclasses override to configure beam visuals (colors, widths, physics). */
  protected configureBeam(b: BeamEffect): void {
    b.color = "#18213a";
    b.shadowBeamColor = "#587cb3";
    b.lineWidth = 5;
    b.tailWidth = 2;
    b.tailTaperStart = 0.75;
    b.headTipWidth = 1;
    b.headTaperLength = 0.0625;
    b.shadowOffsetY = -4;
    b.beamOutlineColor = "#1f2127";
    b.gravity = 0;
    b.turbulence = 0.03;
    b.damping = 0.95;
    b.springStiffness = 0.04;
    b.springDamping = 0.06;
    b.bendingStiffness = 0;
    b.iterations = 8;
    b.useBrightnessSampling = true;
    b.renderFps = 15;
    b.eyeColor = "#000000";
    b.showStripes = this.hasStripes;
  }

  /**
   * Returns pathfinding options for this entity's movementMode.
   * All paths use useLastPlayerPos so A* targets the player's last known tile.
   */
  private _pathOptions(): { useLastPlayerPos: true; diagonals?: boolean; diagonalsOnly?: boolean; allowOmni?: boolean } {
    switch (this.movementMode) {
      case "diagonal":
        return { useLastPlayerPos: true, diagonals: true, diagonalsOnly: true };
      case "omni":
        return { useLastPlayerPos: true, diagonals: true };
      case "orthogonal":
      default:
        return { useLastPlayerPos: true, allowOmni: false };
    }
  }

  /**
   * Lazily creates (or returns the existing) BeamEffect for beam rendering mode.
   */
  private ensureBeam = (): BeamEffect | null => {
    if (this.beam) return this.beam;
    const alive = this.segments.filter((s) => !s.dead);
    const lastSeg = alive[alive.length - 1];
    const endX = lastSeg ? lastSeg.x : this.x;
    const endY = lastSeg ? lastSeg.y : this.y;
    const b = new BeamEffect(this.x, this.y, endX, endY, this);
    this.configureBeam(b);
    b.setHostRoom(this.room);
    this.beam = b;
    return b;
  };

  /** Updates beam endpoints and guide nodes from the visual (animated) positions of each segment. */
  private _updateBeam = (): void => {
    if (!this.beam) return;
    const alive = this.segments.filter((s) => !s.dead);
    const lastSeg = alive[alive.length - 1];
    this.beam.x = this.x - this.drawX;
    this.beam.y = this.y - this.drawY;
    this.beam.targetX = lastSeg
      ? lastSeg.x - lastSeg.drawX
      : this.x - this.drawX;
    this.beam.targetY = lastSeg
      ? lastSeg.y - lastSeg.drawY
      : this.y - this.drawY;
    this.beam.naturalLength = alive.length * GameConstants.TILESIZE;
    if (alive.length > 0) {
      const anchors: Array<{ x: number; y: number }> = [
        { x: this.x - this.drawX, y: this.y - this.drawY },
        ...alive.map((seg) => ({ x: seg.x - seg.drawX, y: seg.y - seg.drawY })),
      ];
      const N = anchors.length;
      const nodes: BeamGuideNode[] = [];

      for (let i = 0; i < N - 1; i++) {
        if (i + 1 < N - 1) {
          nodes.push({
            x: anchors[i + 1].x,
            y: anchors[i + 1].y,
            tPosition: (i + 1) / (N - 1),
            weight: 0.7,
            influenceDistance: 2.5,
          });
        }

        const P0 = anchors[Math.max(0, i - 1)];
        const P1 = anchors[i];
        const P2 = anchors[i + 1];
        const P3 = anchors[Math.min(N - 1, i + 2)];
        const midX = (-P0.x + 9 * P1.x + 9 * P2.x - P3.x) / 16;
        const midY = (-P0.y + 9 * P1.y + 9 * P2.y - P3.y) / 16;
        nodes.push({
          x: midX,
          y: midY,
          tPosition: (i + 0.5) / (N - 1),
          weight: 0.65,
          influenceDistance: 2.5,
        });
      }

      this.beam.setGuideNodes(nodes);
    } else {
      this.beam.setGuideNodes([]);
    }
  };

  /**
   * Kept as a no-op hook for the loadV2 post-pass to call after re-linking
   * segments. Beams have been replaced with per-segment sprites; nothing
   * extra to construct.
   */
  createBeam = () => {
    // no-op: sprite-based rendering needs no separate visual setup.
  };

  clone(): Entity {
    const cloned = super.clone() as AbstractSnakeHeadEnemy;
    cloned.beam = this.beam;
    return cloned;
  }

  hit = (): number => this.damage;

  /**
   * Snake-style chain shift: each segment moves to the predecessor's pre-move position.
   */
  private shiftChain = (headOldX: number, headOldY: number) => {
    let prevOldX = headOldX;
    let prevOldY = headOldY;
    for (const seg of this.segments) {
      if (seg.dead) continue;
      const segOldX = seg.x;
      const segOldY = seg.y;
      if (segOldX !== prevOldX || segOldY !== prevOldY) {
        seg.followTo(prevOldX, prevOldY);
      }
      prevOldX = segOldX;
      prevOldY = segOldY;
    }
  };

  /**
   * Compute the would-be next move tile without committing it.
   * Used during the prep tick to decide whether to issue a hit warning.
   */
  private peekNextMove = (): { x: number; y: number } | null => {
    let disablePositions = this.getEntityDisablePositions();
    for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
      for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
        const tile = this.room.roomArray[xx]?.[yy];
        if (tile instanceof SpikeTrap && (tile as SpikeTrap).on) {
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
    const moves = this.searchPathLocalizedCached(
      this.targetPlayer,
      disablePositions,
      this._pathOptions(),
    );
    if (moves.length === 0) return null;
    return { x: moves[0].pos.x, y: moves[0].pos.y };
  };

  /** Update `this.direction` from an old→new position, including diagonals. */
  private _updateDirection = (oldX: number, oldY: number): void => {
    const dx = this.x - oldX;
    const dy = this.y - oldY;
    if (dx > 0 && dy > 0) this.direction = Direction.DOWN_RIGHT;
    else if (dx > 0 && dy < 0) this.direction = Direction.UP_RIGHT;
    else if (dx < 0 && dy > 0) this.direction = Direction.DOWN_LEFT;
    else if (dx < 0 && dy < 0) this.direction = Direction.UP_LEFT;
    else if (dx > 0) this.direction = Direction.RIGHT;
    else if (dx < 0) this.direction = Direction.LEFT;
    else if (dy > 0) this.direction = Direction.DOWN;
    else if (dy < 0) this.direction = Direction.UP;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (this.dead) return;
    if (this.handleSkipTurns()) return;

    if (!this.seenPlayer) {
      this.lookForPlayer();
      return;
    }
    if (this.room.playerTicked !== this.targetPlayer) return;

    this.alertTicks = Math.max(0, this.alertTicks - 1);
    this.ticks++;

    if (this.ticks % 2 === 1) {
      // ACT turn: pathfind, attack-if-player-in-way, otherwise move + shift chain.
      this.rumbling = true;
      const oldX = this.x;
      const oldY = this.y;

      let disablePositions = this.getEntityDisablePositions();
      for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
        for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
          const tile = this.room.roomArray[xx]?.[yy];
          if (tile instanceof SpikeTrap && (tile as SpikeTrap).on) {
            disablePositions.push({ x: xx, y: yy } as astar.Position);
          }
        }
      }

      const moves = this.searchPathLocalizedCached(
        this.targetPlayer,
        disablePositions,
        this._pathOptions(),
      );

      if (moves.length > 0) {
        const moveX = moves[0].pos.x;
        const moveY = moves[0].pos.y;
        let hitPlayer = false;
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
              this.drawX = 0.5 * (this.x - p.x);
              this.drawY = 0.5 * (this.y - p.y);
              if (p === this.game.players[this.game.localPlayerID])
                this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
            }
            hitPlayer = true;
          }
        }
        if (!hitPlayer) {
          this.tryMove(moveX, moveY);
          this.setDrawXY(oldX, oldY);
          this._updateDirection(oldX, oldY);
          if (this.x !== oldX || this.y !== oldY) {
            this.shiftChain(oldX, oldY);
          }
        }
      }

      this.rumbling = false;
      this.unconscious = true;
    } else {
      // PREP turn: shake in place and only warn if the act turn would land on the player.
      this.rumbling = true;
      this.unconscious = false;
      const next = this.peekNextMove();
      if (
        next &&
        next.x === this.targetPlayer.x &&
        next.y === this.targetPlayer.y
      ) {
        this.makeHitWarnings();
      }
    }
  };

  uniqueKillBehavior = () => {
    if (this.cloned) return;
    for (const seg of this.segments) {
      if (seg.dead) continue;
      Entity.cloneEntity(seg);
      seg.dead = true;
      seg.head = null;
      seg.predecessor = null;
    }
    this.segments = [];
  };

  /**
   * Head sprite faces away from its first segment.
   */
  private pickSprite = (): { x: number; y: number } => {
    const first = this.segments.find((s) => !s.dead);
    if (first) {
      const dirToNext = snakeDirTo(this, first);
      if (dirToNext) return pickHeadSprite(dirToNext);
    }
    switch (this.direction) {
      case Direction.LEFT:
        return SNAKE_SPRITES.head.left;
      case Direction.RIGHT:
        return SNAKE_SPRITES.head.right;
      case Direction.UP:
        return SNAKE_SPRITES.head.up;
      case Direction.DOWN:
      default:
        return SNAKE_SPRITES.head.down;
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    if (this.hasShadow) this.drawShadow(delta);

    if (GameConstants.SNAKE_BEAM_RENDERING) {
      if (!this.cloned) {
        const beam = this.ensureBeam();
        if (beam) {
          this._updateBeam();
          beam.render(
            beam.x,
            beam.y,
            beam.targetX,
            beam.targetY,
            beam.color,
            beam.lineWidth,
            delta,
            beam.compositeOperation,
            false,
            true,
          );
        }
      } else if (this.beam) {
        this.beam.render(
          this.beam.x,
          this.beam.y,
          this.beam.targetX,
          this.beam.targetY,
          this.beam.color,
          this.beam.lineWidth,
          delta,
          this.beam.compositeOperation,
          false,
          false,
        );
      }
      Game.ctx.restore();
      return;
    }

    if (!this.cloned) {
      const animMagnitude = Math.max(
        Math.abs(this.drawX),
        Math.abs(this.drawY),
      );
      if (animMagnitude <= 0.5) {
        const sprite = this.pickSprite();
        this.tileX = sprite.x;
        this.tileY = sprite.y;
      }
    }

    Game.drawMob(
      this.tileX,
      this.tileY,
      1,
      1,
      this.x - this.drawX,
      this.y - this.drawY,
      1,
      1,
      this.softShadeColor,
      0,
      undefined,
      this.outlineColor(),
      this.outlineOpacity(),
    );
    this.room.applyInlineShadeOverlay(
      this.x,
      this.y,
      this.drawX,
      this.drawY,
      Game.mobset,
      this.tileX,
      this.tileY,
    );
    Game.ctx.restore();
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
      false,
    );

    if (GameConstants.SNAKE_DEBUG_CENTERS) {
      const ts = GameConstants.TILESIZE;
      Game.ctx.save();
      Game.ctx.fillStyle = "#ff2222";
      Game.ctx.fillRect(
        Math.round((this.x - this.drawX + 0.5) * ts) - 1,
        Math.round((this.y - this.drawY + 0.5) * ts) - 1,
        2,
        2,
      );
      Game.ctx.fillStyle = "#ff22ff";
      for (const seg of this.segments) {
        if (seg.dead) continue;
        Game.ctx.fillRect(
          Math.round((seg.x - seg.drawX + 0.5) * ts) - 1,
          Math.round((seg.y - seg.drawY + 0.5) * ts) - 1,
          2,
          2,
        );
      }
      Game.ctx.restore();
    }
  };
}
