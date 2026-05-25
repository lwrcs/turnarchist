/**
 * Sprite tile coordinates for snake body parts on the mob spritesheet.
 * Pixel coords / 16 → tile coords. Each sprite is 1x1 tile.
 *
 * Naming conventions:
 *  - "bend" tiles connect the two named directions (e.g. "left-down" = body
 *    extends to the left neighbor and the down neighbor from this tile).
 *  - "head face X" = head sprite facing direction X (body extends in the
 *    opposite direction from the head's facing).
 *  - "tail X" = tail tip pointing direction X (body extends opposite).
 */

export type SnakeDir = "left" | "right" | "up" | "down";

export const SNAKE_SPRITES = {
  bend: {
    "left-down": { x: 38, y: 16 },
    "right-down": { x: 37, y: 16 },
    "left-up": { x: 38, y: 17 },
    "right-up": { x: 37, y: 17 },
  },
  straight: {
    vertical: { x: 39, y: 16 },
    horizontal: { x: 40, y: 16 },
  },
  head: {
    left: { x: 39, y: 17 },
    right: { x: 40, y: 17 },
    up: { x: 41, y: 16 },
    down: { x: 41, y: 17 },
  },
  tail: {
    up: { x: 42, y: 16 },
    down: { x: 42, y: 17 },
    right: { x: 43, y: 16 },
    left: { x: 43, y: 17 },
  },
} as const;

/** Returns the cardinal direction from `from` to `to`, or null if not cardinal-adjacent. */
export const snakeDirTo = (
  from: { x: number; y: number },
  to: { x: number; y: number },
): SnakeDir | null => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 1 && dy === 0) return "right";
  if (dx === -1 && dy === 0) return "left";
  if (dx === 0 && dy === 1) return "down";
  if (dx === 0 && dy === -1) return "up";
  return null;
};

const oppositeDir = (d: SnakeDir): SnakeDir => {
  if (d === "left") return "right";
  if (d === "right") return "left";
  if (d === "up") return "down";
  return "up";
};

/**
 * Pick the body sprite for a middle segment given the two cardinal directions
 * pointing at its neighbors (predecessor + successor).
 *  - If the two directions are opposite (straight section): horizontal/vertical
 *  - Otherwise (bend): one of the four bend tiles, named by the two directions.
 */
export const pickBodySprite = (
  d1: SnakeDir,
  d2: SnakeDir,
): { x: number; y: number } => {
  if (d1 === oppositeDir(d2)) {
    if (d1 === "left" || d1 === "right") return SNAKE_SPRITES.straight.horizontal;
    return SNAKE_SPRITES.straight.vertical;
  }
  const hasLeft = d1 === "left" || d2 === "left";
  const hasRight = d1 === "right" || d2 === "right";
  const hasUp = d1 === "up" || d2 === "up";
  const hasDown = d1 === "down" || d2 === "down";
  if (hasLeft && hasDown) return SNAKE_SPRITES.bend["left-down"];
  if (hasRight && hasDown) return SNAKE_SPRITES.bend["right-down"];
  if (hasLeft && hasUp) return SNAKE_SPRITES.bend["left-up"];
  if (hasRight && hasUp) return SNAKE_SPRITES.bend["right-up"];
  // Fallback: same direction repeated; treat as straight.
  return SNAKE_SPRITES.straight.horizontal;
};

/** Head sprite: head looks AWAY from the next segment (opposite of body direction). */
export const pickHeadSprite = (
  dirToNext: SnakeDir,
): { x: number; y: number } => SNAKE_SPRITES.head[oppositeDir(dirToNext)];

/** Tail sprite: tail tip points AWAY from predecessor (opposite of body direction). */
export const pickTailSprite = (
  dirToPredecessor: SnakeDir,
): { x: number; y: number } => SNAKE_SPRITES.tail[oppositeDir(dirToPredecessor)];
