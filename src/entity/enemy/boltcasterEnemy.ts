import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { Utils } from "../../utility/utils";
import { Enemy } from "./enemy";
import { HitWarning } from "../../drawable/hitWarning";
import { ArrowParticle } from "../../particle/arrowParticle";
import { GameConstants } from "../../game/gameConstants";
import { Entity } from "../entity";

enum BoltcasterState {
  SEEK_LINE,
  LOADING,
}

export class BoltcasterEnemy extends Enemy {
  static examineText = "A boltcaster. It seeks a clear line, then fires.";
  state: BoltcasterState;
  isLoading: boolean;
  loadDx: number;
  loadDy: number;
  loadedPlayerX: number;
  loadedPlayerY: number;
  loadTrailFrame: number;
  loadTrailAlpha: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);

    this.name = "boltcaster";
    this.tileX = 17 + 26; // reuse basic enemy sprite
    this.tileY = 8;
    this.health = 2;
    this.maxHealth = 2;
    this.defaultMaxHealth = 2;
    this.dropChance = 1;
    this.state = BoltcasterState.SEEK_LINE;
    this.isLoading = false;
    this.loadDx = 0;
    this.loadDy = 0;
    this.loadedPlayerX = 0;
    this.loadedPlayerY = 0;
    this.loadTrailFrame = 0;
    this.loadTrailAlpha = 1;

    // Drop crossbow parts similar to scythe/shield pieces
    this.getDrop(["crossbow"], false);
  }

  private isInlineWithPlayerAndClear = (px: number, py: number): boolean => {
    return this.isInlineWithPlayerAndClearUsingOccupied(
      px,
      py,
      this.buildOccupiedSet(),
    );
  };

  private buildOccupiedSet = (): Set<string> => {
    const out = new Set<string>();
    const z = this.z ?? 0;
    for (const e of this.room.entities) {
      if (e === this) continue;
      const ez = e.z ?? 0;
      if (ez !== z) continue;
      const w = e.w || 1;
      const h = e.h || 1;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          out.add(`${e.x + dx},${e.y + dy}`);
        }
      }
    }
    return out;
  };

  private isInlineWithPlayerAndClearUsingOccupied = (
    px: number,
    py: number,
    occupied: Set<string>,
  ): boolean => {
    if (this.x !== px && this.y !== py) return false;
    const dx = Math.sign(px - this.x);
    const dy = Math.sign(py - this.y);
    let cx = this.x;
    let cy = this.y;
    while (true) {
      cx += dx;
      cy += dy;
      if (cx === px && cy === py) return true;
      if (!this.room.tileInside(cx, cy)) return false;
      const tile = this.room.roomArray[cx]?.[cy];
      if (!tile || tile.isSolid()) return false;
      if (occupied.has(`${cx},${cy}`)) return false;
    }
  };

  private lineClearUsingOccupied = (
    occupied: Set<string>,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): boolean => {
    if (x0 !== x1 && y0 !== y1) return false;
    const dx = Math.sign(x1 - x0);
    const dy = Math.sign(y1 - y0);
    let cx = x0;
    let cy = y0;
    while (true) {
      cx += dx;
      cy += dy;
      if (cx === x1 && cy === y1) return true;
      if (!this.room.tileInside(cx, cy)) return false;
      const tile = this.room.roomArray[cx]?.[cy];
      if (!tile || tile.isSolid()) return false;
      if (occupied.has(`${cx},${cy}`)) return false;
    }
  };

  private findNearestInlineTile = (): { x: number; y: number } | null => {
    const p = this.getPlayer();
    if (!p) return null;
    const px = p.x;
    const py = p.y;

    const occupied = this.buildOccupiedSet();
    const candidates: Array<{ x: number; y: number }> = [];

    // Scan outward from player until blocked; every tile before the first blocker has clear LOS.
    const scan = (dx: number, dy: number) => {
      let x = px;
      let y = py;
      while (true) {
        x += dx;
        y += dy;
        if (!this.room.tileInside(x, y)) break;
        const tile = this.room.roomArray[x]?.[y];
        if (!tile || tile.isSolid()) break;
        if (occupied.has(`${x},${y}`)) break;
        candidates.push({ x, y });
      }
    };
    scan(-1, 0);
    scan(1, 0);
    scan(0, -1);
    scan(0, 1);

    if (candidates.length === 0) return null;

    // Cheap heuristic: pick a nearby candidate (actual A* is done in behavior).
    candidates.sort(
      (a, b) =>
        Utils.distance(this.x, this.y, a.x, a.y) -
        Utils.distance(this.x, this.y, b.x, b.y),
    );
    return candidates[0] ?? null;
  };

  private lineClear = (x0: number, y0: number, x1: number, y1: number): boolean =>
    this.lineClearUsingOccupied(this.buildOccupiedSet(), x0, y0, x1, y1);

  private findBestStepTowardInlineTile = (
    player: Player,
    disablePositions: Array<astar.Position>,
    occupied: Set<string>,
  ): { x: number; y: number } | null => {
    const px = player.x;
    const py = player.y;
    const candidates: Array<{ x: number; y: number }> = [];

    const scan = (dx: number, dy: number) => {
      let x = px;
      let y = py;
      while (true) {
        x += dx;
        y += dy;
        if (!this.room.tileInside(x, y)) break;
        const tile = this.room.roomArray[x]?.[y];
        if (!tile || tile.isSolid()) break;
        if (occupied.has(`${x},${y}`)) break;
        candidates.push({ x, y });
      }
    };
    scan(-1, 0);
    scan(1, 0);
    scan(0, -1);
    scan(0, 1);

    if (candidates.length === 0) return null;

    // Prefer nearby candidates first; only run A* on a small top-N set.
    candidates.sort(
      (a, b) =>
        Math.abs(a.x - this.x) +
        Math.abs(a.y - this.y) -
        (Math.abs(b.x - this.x) + Math.abs(b.y - this.y)),
    );

    let bestStep: { x: number; y: number } | null = null;
    let bestLen = Infinity;
    const maxCandidatesToTry = 14;
    for (let i = 0; i < candidates.length && i < maxCandidatesToTry; i++) {
      const c = candidates[i];
      const moves = this.searchPathLocalized({ x: c.x, y: c.y }, disablePositions);
      if (!moves || moves.length === 0) continue;
      if (moves.length < bestLen) {
        bestLen = moves.length;
        bestStep = { x: moves[0].pos.x, y: moves[0].pos.y };
        if (bestLen <= 1) break;
      }
    }
    return bestStep;
  };

  private makeLineHitWarnings = (px: number, py: number) => {
    const dx = Math.sign(px - this.x);
    const dy = Math.sign(py - this.y);
    let cx = this.x;
    let cy = this.y;
    while (true) {
      cx += dx;
      cy += dy;
      if (cx === px && cy === py) break;
      if (!this.room.tileInside(cx, cy)) break;
      // stop at solid tiles
      const tile = this.room.roomArray[cx]?.[cy];
      if (!tile || tile.isSolid()) break;
      // singular hit warning per tile
      this.makeHitWarning(px, py, cx, cy);
    }
  };

  makeHitWarning = (x: number, y: number, eX?: number, eY?: number) => {
    this.room.hitwarnings.push(
      new HitWarning(this.room.game, x, y, eX, eY, true, false, this),
    );
  };

  private fireLoadedShot = () => {
    // Prefer current inline LOS direction if available; otherwise use stored direction
    let dx = this.loadDx;
    let dy = this.loadDy;
    const player = this.targetPlayer;
    if (player && (this.x === player.x || this.y === player.y)) {
      if (this.lineClear(this.x, this.y, player.x, player.y)) {
        dx = Math.sign(player.x - this.x) || 0;
        dy = Math.sign(player.y - this.y) || 0;
      }
    }
    let cx = this.x;
    let cy = this.y;
    let endX = cx;
    let endY = cy;
    let lastFreeX = cx;
    let lastFreeY = cy;
    let hitEntity: Entity | null = null;
    let hitPlayer = false;

    while (true) {
      cx += dx;
      cy += dy;
      if (!this.room.tileInside(cx, cy)) break;
      const tile = this.room.roomArray[cx]?.[cy];
      if (!tile || tile.isSolid()) {
        // Stop arrow so that its tip meets the wall boundary without drawing into the wall
        if (dx > 0) {
          endX = cx - 0.5; // center such that forward edge (w/2=0.5) is at wall's left edge
          endY = lastFreeY + 0.0;
        } else if (dx < 0) {
          endX = cx + 1.5; // center such that forward edge (left) meets wall's right edge
          endY = lastFreeY + 0.0;
        } else if (dy > 0) {
          endY = cy - 0.5; // center such that forward edge meets wall's top edge
          endX = lastFreeX + 0.0;
        } else if (dy < 0) {
          endY = cy + 1.5; // center such that forward edge meets wall's bottom edge
          endX = lastFreeX + 0.0;
        }
        break;
      }
      // If we reach the player's current tile, hit the player
      if (player && cx === player.x && cy === player.y) {
        endX = cx;
        endY = cy;
        hitPlayer = true;
        break;
      }
      const entity = this.room.entities.find(
        (e) => e !== this && e.occupiesTile(cx, cy, this.z ?? 0),
      );
      if (entity) {
        hitEntity = entity;
        endX = cx;
        endY = cy;
        break;
      }
      endX = cx;
      endY = cy;
      lastFreeX = cx;
      lastFreeY = cy;
    }

    // Visual arrow
    // Align arrow vertical position with beam when firing horizontally
    const horizontal = dx !== 0 && dy === 0;
    const startX = this.x + 0.5;
    const startY = horizontal ? this.y - 0.25 : this.y;
    const finalEndX = endX + 0.5;
    const finalEndY = horizontal ? endY - 0.25 : endY;

    this.room.particles.push(
      new ArrowParticle(this.room, startX, startY, finalEndX, finalEndY),
    );

    // Apply damage
    if (hitPlayer && player) {
      const src = this.closestTileToPoint(player.x, player.y);
      player.hurt(this.hit(), this.name, { source: { x: src.x, y: src.y } });
    } else if (hitEntity) {
      // Enemy-to-enemy damage should not feed an Enemy instance into `hurt()`.
      // `hurt()` expects a Player (for aggro/targeting) or null (environmental/neutral damage).
      hitEntity.hurt(null, 1);
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    //this.updateShadeColor(delta);
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    this.frame += 0.1 * delta;
    if (this.frame >= 4) this.frame = 0;
    if (this.hasShadow) this.drawShadow(delta);

    // Shake while loading (like Crab)
    this.rumbling = this.isLoading;
    let rumbleX = this.rumble(this.rumbling, this.frame, this.direction).x;
    let rumbleY = this.rumble(this.rumbling, this.frame, this.direction).y;

    this.drawMobWithCrush(
      this.tileX, // + Math.floor(this.frame),
      this.tileY, // + this.direction * 2,
      1,
      2,
      this.x - this.drawX + rumbleX,
      this.y - this.drawYOffset - this.drawY - this.jumpY + rumbleY,
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

    // Draw loading beam similar to ChargeEnemy's charge trail
    if (this.isLoading) {
      this.drawLoadBeam(delta);
    }
    Game.ctx.globalAlpha = 1;
  };

  behavior = () => {
    // Save last position
    this.lastX = this.x;
    this.lastY = this.y;

    if (this.dead) return;
    if (this.handleSkipTurns()) return;

    // Tick counter
    this.ticks++;

    if (!this.seenPlayer) this.lookForPlayer();
    else if (this.seenPlayer) {
      if (this.room.playerTicked === this.targetPlayer) {
        this.alertTicks = Math.max(0, this.alertTicks - 1);

        const player = this.targetPlayer;
        const occupied = this.buildOccupiedSet();

        // If too close to the player, retreat immediately
        if (player && this.playerDistance(player) <= 1 && !this.isLoading) {
          this.runAway(true);
          return;
        }

        // If currently loading, fire this turn
        if (this.isLoading) {
          this.isLoading = false;
          this.rumbling = false;
          this.fireLoadedShot();
          return;
        }

        // If inline and clear, start loading sequence
        if (this.isInlineWithPlayerAndClearUsingOccupied(player.x, player.y, occupied)) {
          this.loadDx = Math.sign(player.x - this.x) || 0;
          this.loadDy = Math.sign(player.y - this.y) || 0;
          this.loadedPlayerX = player.x;
          this.loadedPlayerY = player.y;
          this.facePlayer(player);
          this.isLoading = true;
          this.rumbling = true;
          this.makeLineHitWarnings(player.x, player.y);
          return;
        }

        // Otherwise, pathfind to nearest inline tile with clear LOS
        const disablePositions: Array<astar.Position> = [];
        for (const e of this.room.entities) {
          if (e !== this)
            disablePositions.push({ x: e.x, y: e.y } as astar.Position);
        }
        for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
          for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
            if (
              this.room.roomArray[xx]?.[yy] instanceof SpikeTrap &&
              (this.room.roomArray[xx][yy] as SpikeTrap).on
            ) {
              disablePositions.push({ x: xx, y: yy } as astar.Position);
            }
          }
        }

        const target = this.findNearestInlineTile();

        const step =
          target &&
          this.findBestStepTowardInlineTile(player, disablePositions, occupied);

        if (step) {
          const oldX = this.x;
          const oldY = this.y;

          this.facePlayer(player);

          // Move
          this.tryMove(step.x, step.y);
          this.setDrawXY(oldX, oldY);

          if (this.x > oldX) this.direction = Direction.RIGHT;
          else if (this.x < oldX) this.direction = Direction.LEFT;
          else if (this.y > oldY) this.direction = Direction.DOWN;
          else if (this.y < oldY) this.direction = Direction.UP;

          // Warn during approach
          this.makeHitWarnings();
        } else {
          // Default fallback: pursue player normally
          const moves = this.searchPathLocalized(player, disablePositions);
          if (moves && moves.length > 0) {
            const moveX = moves[0].pos.x;
            const moveY = moves[0].pos.y;
            const oldX = this.x;
            const oldY = this.y;
            this.tryMove(moveX, moveY);
            this.setDrawXY(oldX, oldY);
          }
        }
      }
    }
  };

  private computeLoadBeamEnd = (): { endX: number; endY: number } => {
    // Determine direction; fall back to current facing if needed
    let dx = this.loadDx;
    let dy = this.loadDy;
    if (dx === 0 && dy === 0) {
      dx =
        this.direction === Direction.RIGHT
          ? 1
          : this.direction === Direction.LEFT
            ? -1
            : 0;
      dy =
        this.direction === Direction.DOWN
          ? 1
          : this.direction === Direction.UP
            ? -1
            : 0;
    }

    let cx = this.x;
    let cy = this.y;
    let endX = cx;
    let endY = cy;
    const occupied = this.buildOccupiedSet();

    // Step forward until blocked by solid tile or entity; cap length generously
    for (let steps = 0; steps < 50; steps++) {
      cx += dx;
      cy += dy;
      if (!this.room.tileInside(cx, cy)) break;
      const tile = this.room.roomArray[cx]?.[cy];
      if (!tile || tile.isSolid()) break;
      // Any entity blocks the pre-fire beam visualization
      if (occupied.has(`${cx},${cy}`)) break;
      endX = cx;
      endY = cy;
      // Optional early stop if we reached the stored player tile at load time
      if (cx === this.loadedPlayerX && cy === this.loadedPlayerY) break;
    }

    return { endX, endY };
  };

  private drawLoadBeam = (delta: number) => {
    this.loadTrailFrame += 0.2 * delta;

    if (Math.floor(this.loadTrailFrame) % 2 === 0) {
      // Anchor near the weapon sprite similar to charge trail offsets
      let startX = (this.x + 0.5) * GameConstants.TILESIZE;
      let startY = (this.y - 0.25) * GameConstants.TILESIZE;

      if (this.direction === Direction.LEFT) startX -= 3;
      else if (this.direction === Direction.RIGHT) startX += 3;
      else if (this.direction === Direction.DOWN) startY += 2;
      else if (this.direction === Direction.UP) startY -= 8;

      const { endX, endY } = this.computeLoadBeamEnd();

      Game.ctx.strokeStyle = "white";
      Game.ctx.lineWidth = GameConstants.TILESIZE * 0.1;
      Game.ctx.beginPath();
      Game.ctx.moveTo(Math.round(startX), Math.round(startY));
      Game.ctx.lineCap = "round";
      Game.ctx.lineTo(
        Math.round((endX + 0.5) * GameConstants.TILESIZE),
        Math.round((endY - 0.25) * GameConstants.TILESIZE),
      );
      Game.ctx.stroke();
      Game.ctx.globalAlpha = 1;
    }
  };
}
