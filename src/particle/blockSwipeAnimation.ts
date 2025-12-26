import { Direction, Game } from "../game";
import { Particle } from "./particle";

/**
 * A short-lived "block" effect that reuses the sword 2x2 swipe sheet,
 * but renders only the middle frame for a fixed duration.
 */
export class BlockSwipeAnimation extends Particle {
  private readonly tileX: number;
  private readonly tileY: number;
  private readonly tileYOffset: number;
  private readonly xOffset: number;
  private readonly yOffset: number;
  private elapsedMs: number = 0;
  private readonly durationMs: number = 200;

  constructor(x: number, y: number, direction: Direction, worldZ: number = 0) {
    super();
    // Spawn the effect one tile in the direction the attack is coming from.
    // Origin is typically the player position.

    this.x = x;
    this.y = y - 0.5;
    this.worldZ = worldZ;
    this.dead = false;

    // Reuse existing swipe sheets:
    // - Cardinals: sword swipe (tileY=48) with offsets 0/2/4/6
    // - Diagonals: diagonal block swipe (tileY=40) with offsets described by design
    const isDiagonal =
      direction === Direction.UP_RIGHT ||
      direction === Direction.UP_LEFT ||
      direction === Direction.DOWN_LEFT ||
      direction === Direction.DOWN_RIGHT;

    this.tileY = isDiagonal ? 40 : 48;
    // "Middle frame" of sword animation:
    // sword uses frames=6 and draws columns at tileX 0,2,4,6; the midpoint maps to 4.
    // Note: tileX is intentionally set by the caller/authoring of the sheet.
    this.tileX = 10;

    switch (direction) {
      case Direction.DOWN:
        this.tileYOffset = 0;
        this.yOffset = -0.25;
        this.xOffset = 0;
        break;
      case Direction.UP:
        this.tileYOffset = 2;
        this.yOffset = 0.25;
        this.xOffset = 0;
        break;
      case Direction.LEFT:
        this.tileYOffset = 4;
        this.xOffset = 0.25;
        this.yOffset = 0;
        break;
      case Direction.RIGHT:
        this.tileYOffset = 6;
        this.xOffset = -0.25;
        this.yOffset = 0;
        break;
      // Diagonals: tileY=40; offsets: UR=0, UL=2, DL=4, DR=6
      case Direction.UP_RIGHT:
        this.tileYOffset = 0;
        this.xOffset = -0.25;
        this.yOffset = 0.25;
        break;
      case Direction.UP_LEFT:
        this.tileYOffset = 2;
        this.xOffset = 0.25;
        this.yOffset = 0.25;
        break;
      case Direction.DOWN_LEFT:
        this.tileYOffset = 4;
        this.xOffset = 0.25;
        this.yOffset = -0.25;
        break;
      case Direction.DOWN_RIGHT:
        this.tileYOffset = 6;
        this.xOffset = -0.25;
        this.yOffset = -0.25;
        break;
      default:
        this.tileYOffset = 0;
        this.xOffset = 0;
        this.yOffset = 0;
        break;
    }
  }

  drawTopLayer = (delta: number) => {
    if (this.dead) return;

    Game.drawFX(
      this.tileX,
      this.tileY + this.tileYOffset,
      2,
      2,
      this.x - 0.5 + this.xOffset,
      this.y - 0.5 + this.yOffset,
      2,
      2,
    );

    // delta is normalized to 60fps, so each 1.0 delta ~= 16.666ms
    this.elapsedMs += (delta * 1000) / 60;
    if (this.elapsedMs >= this.durationMs) this.dead = true;
  };
}
