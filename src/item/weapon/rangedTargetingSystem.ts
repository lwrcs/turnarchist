import type { Player } from "../../player/player";
import { Direction } from "../../game";
import { GameplaySettings } from "../../game/gameplaySettings";

export interface RangedWeapon {
  /** Fire toward the given world tile. Returns true if a projectile was launched. */
  fireAtTarget(player: Player, tx: number, ty: number): boolean;
  /** Max range in tiles (optional, informational). */
  targetingMaxRange?: number;
  /** Offsets from the aim tile that will be affected by the weapon's pattern. */
  getPatternOffsets?(): Array<{ dx: number; dy: number }>;
  /**
   * When true, the targeting system will redirect the cursor to the first enemy
   * whose tile the shot line passes through before reaching the aimed tile.
   */
  lineIntercept?: boolean;
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
      const intercept = this.findPathIntercept(nx, ny);
      if (intercept) {
        this.targetX = intercept.x;
        this.targetY = intercept.y;
      }
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
    const intercept = this.findPathIntercept(lastX, lastY);
    if (intercept) {
      this.targetX = intercept.x;
      this.targetY = intercept.y;
    } else {
      this.targetX = lastX;
      this.targetY = lastY;
    }
  }

  /**
   * Returns the tile of the closest enemy that blocks the shot path, or null.
   *
   * Two-pass logic:
   *  1. Strict margin (CROSSBOW_LINE_INTERCEPT_MARGIN = 0.35): a single enemy squarely
   *     in the path (cardinal, diagonal, or closely-aligned off-angle) triggers a redirect.
   *  2. Loose margin (CROSSBOW_LINE_INTERCEPT_MULTI_MARGIN = 0.10): if 2+ enemies
   *     simultaneously clip the path at the looser threshold, the closest redirects.
   *     This handles narrow corridors where two adjacent enemies together block the shot
   *     even if neither is perfectly in line.
   */
  private findPathIntercept(tx: number, ty: number): { x: number; y: number } | null {
    if (!this.weapon?.lineIntercept) return null;
    if (!GameplaySettings.CROSSBOW_LINE_INTERCEPT) return null;
    const room = this.player.getRoom();
    if (!room) return null;

    // Ray from player center toward target tile center (t=0 at player, t=1 at target)
    const px = this.player.x + 0.5;
    const py = this.player.y + 0.5;
    const rdx = tx + 0.5 - px;
    const rdy = ty + 0.5 - py;
    const z = (this.player as any).z ?? 0;

    const slabHits = (margin: number): Array<{ t: number; entity: unknown }> => {
      const hits: Array<{ t: number; entity: unknown }> = [];
      for (const entity of room.entities) {
        const e = entity as any;
        if (e.dead || e.isGhostly || !e.destroyable || e.pushable || !e.isEnemy) continue;
        if ((e.z ?? 0) !== z) continue;

        const ew: number = e.w ?? 1;
        const eh: number = e.h ?? 1;
        const ex: number = e.x;
        const ey: number = e.y;

        if (tx >= ex && tx < ex + ew && ty >= ey && ty < ey + eh) continue;

        const xmin = ex + margin;
        const xmax = ex + ew - margin;
        const ymin = ey + margin;
        const ymax = ey + eh - margin;

        let tmin = 0;
        let tmax = 1;

        if (Math.abs(rdx) < 1e-9) {
          if (px < xmin || px > xmax) continue;
        } else {
          const t1 = (xmin - px) / rdx;
          const t2 = (xmax - px) / rdx;
          tmin = Math.max(tmin, Math.min(t1, t2));
          tmax = Math.min(tmax, Math.max(t1, t2));
        }

        if (Math.abs(rdy) < 1e-9) {
          if (py < ymin || py > ymax) continue;
        } else {
          const t1 = (ymin - py) / rdy;
          const t2 = (ymax - py) / rdy;
          tmin = Math.max(tmin, Math.min(t1, t2));
          tmax = Math.min(tmax, Math.max(t1, t2));
        }

        if (tmax < tmin || tmax < 0 || tmin >= 1) continue;
        hits.push({ t: Math.max(0, tmin), entity });
      }
      return hits;
    };

    // Pass 1: single enemy squarely blocking the path
    const strict = slabHits(GameplaySettings.CROSSBOW_LINE_INTERCEPT_MARGIN);
    if (strict.length > 0) {
      strict.sort((a, b) => a.t - b.t);
      const e = strict[0].entity as any;
      return { x: e.x, y: e.y };
    }

    // Pass 2: two or more enemies collectively crowding the path
    const loose = slabHits(GameplaySettings.CROSSBOW_LINE_INTERCEPT_MULTI_MARGIN);
    if (loose.length >= 2) {
      loose.sort((a, b) => a.t - b.t);
      const e = loose[0].entity as any;
      return { x: e.x, y: e.y };
    }

    return null;
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

  /** All world tiles covered by the weapon's pattern at the current aim point. */
  getPatternTiles(): Array<{ x: number; y: number }> {
    if (!this.active) return [];
    const offsets = this.weapon?.getPatternOffsets?.();
    if (!offsets || offsets.length === 0) return [{ x: this.targetX, y: this.targetY }];
    return offsets.map((o) => ({ x: this.targetX + o.dx, y: this.targetY + o.dy }));
  }

  /** True if (x, y) is covered by the weapon's pattern at the current aim point. */
  isTargetTile(x: number, y: number): boolean {
    if (!this.active) return false;
    return this.getPatternTiles().some((t) => t.x === x && t.y === y);
  }

  /** The weapon currently being aimed, or null. */
  getWeapon(): RangedWeapon | null {
    return this.weapon;
  }
}
