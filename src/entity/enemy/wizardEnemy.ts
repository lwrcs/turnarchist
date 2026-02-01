import { Game } from "../../game";
import { Room } from "../../room/room";
import { Floor } from "../../tile/floor";
import { Bones } from "../../tile/bones";
import { DeathParticle } from "../../particle/deathParticle";
import { WizardTeleportParticle } from "../../particle/wizardTeleportParticle";
import { WizardFireball } from "../../projectile/wizardFireball";
import { Random } from "../../utility/random";
import { Item } from "../../item/item";
import { Enemy } from "./enemy";
import { LightSource } from "../../lighting/lightSource";

export enum WizardState {
  idle,
  attack,
  justAttacked,
  teleport,
}

export abstract class WizardEnemy extends Enemy {
  static difficulty: number = 3;
  ticks: number;
  state: WizardState;
  frame: number;
  seenPlayer: boolean;
  projectileColor: [number, number, number];
  readonly ATTACK_RADIUS = 5;
  static tileX: number = 6;
  static tileY: number = 0;

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.defaultMaxHealth = 1;
    this.tileX = 6;
    this.tileY = 0;
    this.frame = 0;
    this.state = WizardState.attack;
    this.seenPlayer = false;
    this.alertTicks = 0;
    this.name = "wizard bomber";
    if (drop) this.drop = drop;
    // Include "wizard" category so wizard-specific drops can be added without affecting other enemies.
    this.getDrop(["weapon", "equipment", "consumable", "tool", "coin", "wizard"]);
  }

  // (no additional helpers required here)

  newLightSource = (
    x: number,
    y: number,
    radius: number,
    color: [number, number, number],
    brightness: number,
  ) => {
    this.lightSource = new LightSource(x, y, radius, color, brightness);
  };

  addLightSource = (lightSource: LightSource) => {
    this.room.lightSources.push(lightSource);
  };

  removeLightSource = (lightSource: LightSource) => {
    this.room.lightSources = this.room.lightSources.filter(
      (ls) => ls !== lightSource,
    );
  };

  hit = (): number => {
    return 1;
  };

  withinAttackingRangeOfPlayer = (): boolean => {
    let withinRange = false;
    for (const i in this.game.players) {
      if (
        (this.x - this.game.players[i].x) ** 2 +
          (this.y - this.game.players[i].y) ** 2 <=
        this.ATTACK_RADIUS ** 2
      ) {
        withinRange = true;
      }
    }
    return withinRange;
  };

  protected shuffle = <T>(a: T[]): T[] => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Random.rand() * (i + 1));
      const x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  };

  /**
   * Teleport target selection must be O(1) in room size.
   * Large rooms make Room.getEmptyTiles() extremely expensive.
   *
   * Returns a tile coordinate or null if no suitable position is found.
   */
  protected findTeleportTarget = (
    targetPlayerId: string,
    optimalDist: number,
    opts?: { avoidProjectiles?: boolean; maxAttempts?: number },
  ): { x: number; y: number } | null => {
    const player = this.game.players[targetPlayerId];
    if (!player) return null;

    const avoidProjectiles = opts?.avoidProjectiles ?? true;
    const maxAttempts = opts?.maxAttempts ?? 220;

    // Precompute blocked projectile tiles once.
    const projectileBlocked = new Set<string>();
    if (avoidProjectiles) {
      for (const p of this.room.projectiles) {
        projectileBlocked.add(`${p.x},${p.y}`);
      }
    }

    // Precompute occupied tiles by entities once.
    const occupied = new Set<string>();
    for (const e of this.room.entities) {
      if (e === this) continue;
      const w = e.w || 1;
      const h = e.h || 1;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          occupied.add(`${e.x + dx},${e.y + dy}`);
        }
      }
    }

    const room = this.room;
    const minX = room.roomX + 1;
    const minY = room.roomY + 1;
    const maxX = room.roomX + room.width - 2;
    const maxY = room.roomY + room.height - 2;
    if (minX > maxX || minY > maxY) return null;

    const isEmpty = (x: number, y: number): boolean => {
      const t = room.roomArray[x]?.[y];
      if (!t || t.isSolid()) return false;
      if (avoidProjectiles && projectileBlocked.has(`${x},${y}`)) return false;
      if (occupied.has(`${x},${y}`)) return false;
      return true;
    };

    // 1) Random sampling across the room (bounded attempts)
    let best: { x: number; y: number } | null = null;
    let bestDelta = Infinity;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Random.rand() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Random.rand() * (maxY - minY + 1)) + minY;
      if (!isEmpty(x, y)) continue;
      const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
      const delta = Math.abs(dist - optimalDist);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = { x, y };
        if (bestDelta === 0) return best;
      }
    }

    // 2) Local fallback: check tiles on the Manhattan ring around the player.
    const ring: Array<{ x: number; y: number }> = [];
    for (let dx = -optimalDist; dx <= optimalDist; dx++) {
      const dy = optimalDist - Math.abs(dx);
      ring.push({ x: player.x + dx, y: player.y + dy });
      if (dy !== 0) ring.push({ x: player.x + dx, y: player.y - dy });
    }
    for (const r of ring) {
      if (r.x < minX || r.x > maxX || r.y < minY || r.y > maxY) continue;
      if (isEmpty(r.x, r.y)) return { x: r.x, y: r.y };
    }

    return best;
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;
    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        this.alertTicks = Math.max(0, this.alertTicks - 1);
        switch (this.state) {
          case WizardState.attack:
            const nearestPlayerInfo = this.nearestPlayer();
            if (nearestPlayerInfo !== false) {
              const [distance, targetPlayer] = nearestPlayerInfo;
              const attackLength = 20;

              const offsets = this.calculateProjectileOffsets(
                targetPlayer.x,
                targetPlayer.y,
                10,
              );

              this.attemptProjectilePlacement(
                [
                  { x: -1, y: 0 },
                  { x: -2, y: 0 },
                  { x: 1, y: 0 },
                  { x: 2, y: 0 },
                  { x: 0, y: -1 },
                  { x: 0, y: -2 },
                  { x: 0, y: 1 },
                  { x: 0, y: 2 },
                ],
                WizardFireball,
                false,
              );
            }
            this.state = WizardState.justAttacked;
            break;
          case WizardState.justAttacked:
            this.state = WizardState.idle;
            break;
          case WizardState.teleport:
            let oldX = this.x;
            let oldY = this.y;
            let optimalDist = Game.randTable(
              [2, 2, 3, 3, 3, 3, 3],
              Random.rand,
            );
            // pick a random player to target
            let player_ids = [];
            for (const i in this.game.players) player_ids.push(i);
            let target_player_id = Game.randTable(player_ids, Random.rand);
            if (!this.game.players[target_player_id]) {
              this.state = WizardState.idle;
              break;
            }
            const bestPos = this.findTeleportTarget(
              target_player_id,
              optimalDist,
              { avoidProjectiles: true },
            );
            if (!bestPos) {
              this.state = WizardState.idle;
              break;
            }

            this.tryMove(bestPos.x, bestPos.y);
            this.drawX = this.x - oldX;
            this.drawY = this.y - oldY;
            this.frame = 0; // trigger teleport animation
            this.room.particles.push(new WizardTeleportParticle(oldX, oldY));
            if (this.withinAttackingRangeOfPlayer()) {
              this.state = WizardState.attack;
            } else {
              this.state = WizardState.idle;
            }
            break;
          case WizardState.idle:
            this.state = WizardState.teleport;
            break;
        }
      }
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    if (!this.dead) {
      this.updateDrawXY(delta);

      if (this.state === WizardState.attack) this.tileX = 7;
      else this.tileX = 6;

      if (this.hasShadow) this.drawShadow(delta);
      if (this.frame >= 0) {
        this.drawMobWithCrush(
          Math.floor(this.frame) + 6,
          2,
          1,
          2,
          this.x,
          this.y - 1.5,
          1,
          2,
          this.softShadeColor,
          this.shadeAmount(),
          undefined,
          this.outlineColor(),
          this.outlineOpacity(),
        );
        this.frame += 0.2 * delta;
        if (this.frame > 11) this.frame = -1;
      } else {
        this.drawMobWithCrush(
          this.tileX,
          this.tileY,
          1,
          2,
          this.x - this.drawX,
          this.y - 1.3 - this.drawY,
          1,
          2,
          this.softShadeColor,
          this.shadeAmount(),
          undefined,
          this.outlineColor(),
          this.outlineOpacity(),
        );
      }
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
    Game.ctx.restore();
  };
}
