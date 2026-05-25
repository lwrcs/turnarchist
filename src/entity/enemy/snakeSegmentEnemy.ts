import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Enemy } from "./enemy";
import { GameConstants } from "../../game/gameConstants";
import {
  pickBodySprite,
  pickTailSprite,
  snakeDirTo,
  SNAKE_SPRITES,
  SnakeDir,
} from "./snakeSprites";
import type { AbstractSnakeHeadEnemy } from "./abstractSnakeHeadEnemy";

export class SnakeSegmentEnemy extends Enemy {
  head: AbstractSnakeHeadEnemy | null;
  predecessor: Enemy | null;
  chainIndex: number;
  static difficulty: number = 1;
  static tileX: number = 40;
  static tileY: number = 16;
  static examineText = "A coil of muscle and scale.";

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    head?: AbstractSnakeHeadEnemy,
    predecessor?: Enemy,
    chainIndex: number = 0,
  ) {
    super(room, game, x, y);
    this.head = head ?? null;
    this.predecessor = predecessor ?? null;
    this.chainIndex = chainIndex;

    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 40;
    this.tileY = 16;
    this.name = "snake_segment";
    this.pushable = false;
    this.chainPushable = false;
    this.destroyable = true;
    this.dropChance = 0;
    this.drops = [];
    this.enemyKillXpMultiplier = 0;
    this.hasDamageNumbers = false;
    this.baseDamage = 0;
    this.imageParticleX = 3;
    this.imageParticleY = 30;
    // Snake body sprites are 1x1 and sit flat on the floor — no upward sprite offset.
    this.drawYOffset = 0;
  }

  hit = (): number => 0;

  hurt = (
    playerHitBy: Player | null,
    damage: number,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    if (this.head && !this.head.dead) {
      this.head.hurt(playerHitBy, damage, type);
    }
  };

  kill = () => {
    // Only the head's uniqueKillBehavior should kill segments; ignore direct calls.
    if (this.head && !this.head.dead) return;
    this.dead = true;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    // Movement is driven by the head calling followTo().
  };

  followTo = (x: number, y: number) => {
    if (this.dead) return;
    const oldX = this.x;
    const oldY = this.y;
    this.tryMove(x, y);
    this.setDrawXY(oldX, oldY);
    if (this.x > oldX) this.direction = Direction.RIGHT;
    else if (this.x < oldX) this.direction = Direction.LEFT;
    else if (this.y > oldY) this.direction = Direction.DOWN;
    else if (this.y < oldY) this.direction = Direction.UP;
  };

  /**
   * Sprite is chosen from this segment's logical position relative to its
   * predecessor and successor (the segment after it in the chain). Tail =
   * last segment in chain (no successor).
   */
  private pickSprite = (): { x: number; y: number } => {
    const head = this.head;
    if (!head) return SNAKE_SPRITES.straight.horizontal;
    const successor: Enemy | undefined = head.segments[this.chainIndex + 1];
    const predecessor = this.predecessor;

    const dirPrev: SnakeDir | null = predecessor
      ? snakeDirTo(this, predecessor)
      : null;
    const dirNext: SnakeDir | null = successor
      ? snakeDirTo(this, successor)
      : null;

    if (!successor) {
      // Tail: derive from predecessor direction only.
      if (dirPrev) return pickTailSprite(dirPrev);
      return SNAKE_SPRITES.straight.horizontal;
    }
    if (dirPrev && dirNext) return pickBodySprite(dirPrev, dirNext);
    if (dirPrev) return pickBodySprite(dirPrev, dirPrev);
    if (dirNext) return pickBodySprite(dirNext, dirNext);
    return SNAKE_SPRITES.straight.horizontal;
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);

    if (GameConstants.SNAKE_BEAM_RENDERING) {
      // Beam mode: head's beam (live or dying clone) provides the visual for the whole body.
      Game.ctx.restore();
      return;
    }

    if (this.hasShadow) this.drawShadow(delta);

    // Live segments recompute their sprite from chain context — but only
    // once the movement animation is at least 50% complete. This avoids
    // the sprite snapping to its post-move orientation while the visual
    // is still sliding from the old tile. (drawX/drawY are 1.0 right after
    // a move and decay toward 0; the new sprite kicks in once both fall
    // below half a tile of offset.)
    // Death clones don't have head/predecessor refs (Entity.cloneEntity
    // doesn't copy them) so we preserve the tileX/tileY that cloneEntity
    // already copied from the original at the moment of death.
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

    // Draw sprite with no internal shade; the room's smooth tile-sliced
    // shading is then applied on top so the whole snake reads as one
    // continuous body lit per-tile.
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
  };
}
