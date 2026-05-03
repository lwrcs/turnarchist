import type { Player } from "../../player/player";
import { Direction } from "../../game";

export interface RangedWeapon {
  /** Fire toward the given world tile. Returns true if a projectile was launched. */
  fireAtTarget(player: Player, tx: number, ty: number): boolean;
  /** Max range in tiles (optional, informational). */
  targetingMaxRange?: number;
}

export class RangedTargetingSystem {
  active: boolean = false;
  targetX: number = 0;
  targetY: number = 0;
  /** True once the player has explicitly aimed at a world tile since targeting started. */
  hasAimed: boolean = false;
  private weapon: RangedWeapon | null = null;
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  start(weapon: RangedWeapon): void {
    this.active = true;
    this.weapon = weapon;
    this.hasAimed = false;
    this.targetX = this.player.x;
    this.targetY = this.player.y;
  }

  stop(): void {
    this.active = false;
    this.hasAimed = false;
    this.weapon = null;
  }

  private hasLineOfSight(tx: number, ty: number): boolean {
    const room = this.player.getRoom();
    if (!room) return false;
    const z = (this.player as any).z ?? 0;
    const dx = tx - this.player.x;
    const dy = ty - this.player.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) return true;
    for (let i = 1; i <= steps; i++) {
      const cx = Math.round(this.player.x + (dx * i) / steps);
      const cy = Math.round(this.player.y + (dy * i) / steps);
      if (cx === tx && cy === ty) break;
      if (room.isSolidAt(cx, cy, z)) return false;
    }
    return true;
  }

  moveTarget(dx: number, dy: number): void {
    if (!this.active) return;
    const nx = this.targetX + dx;
    const ny = this.targetY + dy;
    const room = this.player.getRoom();
    if (!room) return;
    if (room.tileInside(nx, ny) && !room.isSolidAt(nx, ny, (this.player as any).z ?? 0) && this.hasLineOfSight(nx, ny)) {
      this.targetX = nx;
      this.targetY = ny;
    }
  }

  syncToMouse(): void {
    if (!this.active) return;
    const tile = this.player.mouseToTile();
    if (tile.x === undefined || tile.y === undefined) return;
    const room = this.player.getRoom();
    if (!room) return;
    const z = (this.player as any).z ?? 0;
    // Walk from player toward mouse tile, stop at last non-solid tile in LOS
    const dx = (tile.x as number) - this.player.x;
    const dy = (tile.y as number) - this.player.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) {
      this.targetX = this.player.x;
      this.targetY = this.player.y;
      return;
    }
    let lastX = this.player.x;
    let lastY = this.player.y;
    for (let i = 1; i <= steps; i++) {
      const cx = Math.round(this.player.x + (dx * i) / steps);
      const cy = Math.round(this.player.y + (dy * i) / steps);
      if (!room.tileInside(cx, cy) || room.isSolidAt(cx, cy, z)) break;
      lastX = cx;
      lastY = cy;
    }
    this.targetX = lastX;
    this.targetY = lastY;
  }

  fire(): boolean {
    if (!this.active || !this.weapon) {
      this.stop();
      return false;
    }
    const fired = this.weapon.fireAtTarget(this.player, this.targetX, this.targetY);
    if (fired) {
      const dx = this.targetX - this.player.x;
      const dy = this.targetY - this.player.y;
      if (Math.abs(dx) >= Math.abs(dy)) {
        this.player.direction = dx >= 0 ? Direction.RIGHT : Direction.LEFT;
      } else {
        this.player.direction = dy >= 0 ? Direction.DOWN : Direction.UP;
      }
    }
    this.stop();
    return fired;
  }

  /** Angle in radians from player toward current target. Returns null if on player tile. */
  getAngleRad(): number | null {
    const dx = this.targetX - this.player.x;
    const dy = this.targetY - this.player.y;
    if (dx === 0 && dy === 0) return null;
    return Math.atan2(dy, dx);
  }

  /** True if (x, y) is the current target tile. */
  isTargetTile(x: number, y: number): boolean {
    return this.active && this.targetX === x && this.targetY === y;
  }

  /** The weapon currently being aimed, or null. */
  getWeapon(): RangedWeapon | null {
    return this.weapon;
  }
}
