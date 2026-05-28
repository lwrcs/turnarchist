import { Game } from "../../game";
import { Room } from "../../room/room";
import { Item } from "../../item/item";
import { WizardEnemy, WizardState } from "./wizardEnemy";
import { BigWizardFireball } from "../../projectile/bigWizardFireball";
import { WizardFireball } from "../../projectile/wizardFireball";
import { WizardTeleportParticle } from "../../particle/wizardTeleportParticle";
import { GameConstants } from "../../game/gameConstants";
import { Random } from "../../utility/random";
import { Spellbook } from "../../item/weapon/spellbook";
import { EnvType } from "../../constants/environmentTypes";
import { EnergyWizardEnemy } from "./energyWizard";
import { EnemySpawnAnimation } from "../../projectile/enemySpawnAnimation";
import { HitWarning } from "../../drawable/hitWarning";
import { Sound } from "../../sound/sound";

export class BigWizardEnemy extends WizardEnemy {
  static difficulty: number = 4;
  static tileX: number = 35;
  static tileY: number = 0;
  static examineText =
    "A giant wizard. Slow but its explosions cover far more ground.";

  constructor(room: Room, game: Game, x: number, y: number, drop?: Item) {
    super(room, game, x, y, drop);
    this.w = 2;
    this.h = 2;
    this.health = 6;
    this.maxHealth = 6;
    this.defaultMaxHealth = 6;
    this.tileX = 37;
    this.tileY = 0;
    this.name = "big wizard";
    this.projectileColor = [80, 0, 160];

    const parentDropLoot = this.dropLoot;
    this.dropLoot = () => {
      if (
        this.room.envType === EnvType.FOREST &&
        !this.drops.some((d) => d instanceof Spellbook)
      ) {
        this.drops.push(new Spellbook(this.room, this.x, this.y));
      }
      parentDropLoot();
    };
  }

  protected findTeleportTarget = (
    targetPlayerId: string,
    optimalDist: number,
    opts?: { avoidProjectiles?: boolean; maxAttempts?: number },
  ): { x: number; y: number } | null => {
    const player = this.game.players[targetPlayerId];
    if (!player) return null;

    const avoidProjectiles = opts?.avoidProjectiles ?? true;
    const maxAttempts = opts?.maxAttempts ?? 220;

    const projectileBlocked = new Set<string>();
    if (avoidProjectiles) {
      for (const p of this.room.projectiles) {
        projectileBlocked.add(`${p.x},${p.y}`);
      }
    }

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
    const maxX = room.roomX + room.width - 3; // -3 to fit 2-wide
    const maxY = room.roomY + room.height - 3;
    if (minX > maxX || minY > maxY) return null;

    const isEmpty2x2 = (x: number, y: number): boolean => {
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          const t = room.roomArray[x + dx]?.[y + dy];
          if (!t || t.isSolid()) return false;
          if (avoidProjectiles && projectileBlocked.has(`${x + dx},${y + dy}`))
            return false;
          if (occupied.has(`${x + dx},${y + dy}`)) return false;
        }
      }
      return true;
    };

    let best: { x: number; y: number } | null = null;
    let bestDelta = Infinity;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.floor(Random.rand() * (maxX - minX + 1)) + minX;
      const y = Math.floor(Random.rand() * (maxY - minY + 1)) + minY;
      if (!isEmpty2x2(x, y)) continue;
      const dist = Math.abs(x - player.x) + Math.abs(y - player.y);
      const delta = Math.abs(dist - optimalDist);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = { x, y };
        if (bestDelta === 0) return best;
      }
    }

    const ring: Array<{ x: number; y: number }> = [];
    for (let dx = -optimalDist; dx <= optimalDist; dx++) {
      const dy = optimalDist - Math.abs(dx);
      ring.push({ x: player.x + dx, y: player.y + dy });
      if (dy !== 0) ring.push({ x: player.x + dx, y: player.y - dy });
    }
    for (const r of ring) {
      if (r.x < minX || r.x > maxX || r.y < minY || r.y > maxY) continue;
      if (isEmpty2x2(r.x, r.y)) return { x: r.x, y: r.y };
    }

    return best;
  };

  /**
   * Tries to spawn a BigWizardFireball at (this.x + offsetX, this.y + offsetY).
   * Falls back to a regular WizardFireball if any of the 4 tiles the 2×2 fireball
   * would occupy are solid or out of bounds.
   */
  private spawnFireball = (offsetX: number, offsetY: number): void => {
    const tx = this.x + offsetX;
    const ty = this.y + offsetY;

    if (!this.isWithinRoomBounds(tx, ty)) return;

    // Check all 4 tiles of the 2×2 footprint.
    let canFitBig = true;
    for (let dx = 0; dx < 2 && canFitBig; dx++) {
      for (let dy = 0; dy < 2 && canFitBig; dy++) {
        if (!this.isWithinRoomBounds(tx + dx, ty + dy)) {
          canFitBig = false;
          break;
        }
        const t = this.room.roomArray[tx + dx]?.[ty + dy];
        if (!t || t.isSolid() || t.isDoor) canFitBig = false;
      }
    }

    if (canFitBig) {
      this.room.projectiles.push(new BigWizardFireball(this, tx, ty));
    } else {
      // Spawn a WizardFireball on each free tile in the 2×2 footprint.
      for (let dx = 0; dx < 2; dx++) {
        for (let dy = 0; dy < 2; dy++) {
          if (!this.isWithinRoomBounds(tx + dx, ty + dy)) continue;
          const t = this.room.roomArray[tx + dx]?.[ty + dy];
          if (!t || t.isSolid() || t.isDoor) continue;
          this.room.projectiles.push(
            new WizardFireball(this, tx + dx, ty + dy),
          );
        }
      }
    }
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
              for (const off of [
                { x: -2, y: 0 },
                { x: -4, y: 0 },
                { x: 2, y: 0 },
                { x: 4, y: 0 },
                { x: 0, y: -2 },
                { x: 0, y: -4 },
                { x: 0, y: 2 },
                { x: 0, y: 4 },
              ]) {
                this.spawnFireball(off.x, off.y);
              }
            }
            this.state = WizardState.justAttacked;
            break;
          case WizardState.justAttacked:
            this.state = WizardState.idle;
            break;
          case WizardState.teleport:
            const oldX = this.x;
            const oldY = this.y;
            let optimalDist = Game.randTable(
              [2, 2, 3, 3, 3, 3, 3],
              Random.rand,
            );
            let player_ids: string[] = [];
            for (const i in this.game.players) player_ids.push(i);
            let target_player_id = Game.randTable(player_ids, Random.rand);
            if (!this.game.players[target_player_id]) {
              this.state = WizardState.idle;
              break;
            }
            const bestPos = this.findTeleportTarget(
              target_player_id,
              optimalDist,
              {
                avoidProjectiles: true,
              },
            );
            if (!bestPos) {
              this.state = WizardState.idle;
              break;
            }
            this.tryMove(bestPos.x, bestPos.y);
            this.drawX = this.x - oldX;
            this.drawY = this.y - oldY;
            this.room.particles.push(
              new WizardTeleportParticle(oldX + 0.5, oldY + 0.5),
            );
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

        if (this.ticks % 8 === 0) {
          this.trySpawnDiagonalWizard();
        }
      }
    }
    this.ticks++;
  };

  private trySpawnDiagonalWizard = (): void => {
    const corners = [
      { x: this.x - 1, y: this.y - 1 },
      { x: this.x + 2, y: this.y - 1 },
      { x: this.x - 1, y: this.y + 2 },
      { x: this.x + 2, y: this.y + 2 },
    ];

    const valid = corners.filter(({ x, y }) => {
      if (!this.isWithinRoomBounds(x, y)) return false;
      const t = this.room.roomArray[x]?.[y];
      if (!t || t.isSolid() || t.isDoor) return false;
      return !this.room.entities.some(
        (e) => e !== this && e.x === x && e.y === y,
      );
    });

    if (valid.length === 0) return;

    const { x, y } = valid[Math.floor(Random.rand() * valid.length)];
    const spawned = new EnergyWizardEnemy(this.room, this.game, x, y);
    this.room.projectiles.push(new EnemySpawnAnimation(this.room, spawned, x, y));
    this.room.hitwarnings.push(new HitWarning(this.game, x, y, undefined, undefined, true));
    Sound.enemySpawn();
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;
    this.updateDrawXY(delta);
    if (this.hasShadow) this.drawShadow(delta);
    this.drawMobWithCrush(
      this.tileX,
      this.tileY,
      2,
      4,
      this.x - this.drawX,
      this.y - 2.5 - this.drawY,
      2,
      4,
      this.softShadeColor,
      this.shadeAmount(),
      undefined,
      this.outlineColor(),
      this.outlineOpacity(),
    );
    if (!this.seenPlayer) {
      this.drawSleepingZs(
        delta,
        GameConstants.TILESIZE * 0.5,
        GameConstants.TILESIZE * -1,
      );
    }
    if (this.alertTicks > 0) {
      this.drawExclamation(
        delta,
        GameConstants.TILESIZE * 0.5,
        GameConstants.TILESIZE * -1,
      );
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
      this.x + 0.5,
      this.y,
      true,
    );
  };
}
