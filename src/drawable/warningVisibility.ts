/** Mirrors the above-shading arrow/X presentation, independent of tile light. */
export function isWarningVisibleAboveShade(warning: {x: number; y: number; hostile: boolean; directionOnly: boolean},
  playerX: number, playerY: number): boolean {
  return warning.hostile || (!warning.directionOnly &&
    Math.hypot(warning.x-playerX, warning.y-playerY) < 1.999);
}
