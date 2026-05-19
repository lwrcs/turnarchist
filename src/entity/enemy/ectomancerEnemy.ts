import { Game } from "../../game";
import { Direction } from "../../game";
import { Room } from "../../room/room";

import { Enemy } from "./enemy";

import { Utils } from "../../utility/utils";
import { BeamEffect } from "../../projectile/beamEffect";
import { Lighting } from "../../lighting/lighting";
import { Entity } from "../entity";
import { Random } from "../../utility/random";
import { GameplaySettings } from "../../game/gameplaySettings";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";

/**
 * One frozen base enemy and the ghostly copy that acts in its place.
 * Tracked on the Ectomancer so it can re-link beams after teleport / save load
 * and clean up if the Ectomancer dies.
 */
export interface EctomancerLink {
  base: Enemy;
  ghost: Enemy;
}

export class EctomancerEnemy extends Enemy {
  static examineText =
    "An ectomancer. Tears spirits from the living to fight in their place.";
  ticks: number;
  seenPlayer: boolean;
  range: number;
  static tileX: number = 59;
  static tileY: number = 10;
  lastHealth: number;
  /** Active (base, ghost) pairs created by this ectomancer. */
  links: EctomancerLink[];

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.ticks = 0;
    this.health = 6;
    this.lastHealth = this.health;
    this.maxHealth = 6;
    this.defaultMaxHealth = 6;
    this.tileX = EctomancerEnemy.tileX;
    this.tileY = EctomancerEnemy.tileY;
    this.isGhostly = true;
    this.alpha = Entity.GHOSTLY_ALPHA;
    this.seenPlayer = true;
    this.name = "ectomancer";
    this.range = 6;
    this.aggro = false;
    this.frame = 0;
    this.hasShadow = true;
    this.links = [];
    this.shadeColor = "#000000";
    this.enemyKillXpMultiplier = 2;
    this.lightSource = Lighting.newLightSource(
      this.x + 0.5,
      this.y + 0.5,
      [30, 60, 55],
      3.5,
      20,
    );
    this.addLightSource(this.lightSource);
    this.room.updateLighting();
    this.hasBloom = true;
    this.bloomColor = "#8FE0D2"; // pale cyan-green
    this.bloomAlpha = 0.5;
    this.softBloomAlpha = 0;
    this.dropChance = 1;
    this.getDrop(["ectomancer"], false);
    this.pushable = false;
    this.chainPushable = false;
    this.destroyableByOthers = false;
  }

  hit = (): number => 1;
  bleed = () => {};

  uniqueKillBehavior = () => {
    // Kill every ghost we spawned; their death un-freezes the base via Enemy.kill chain below.
    for (const link of this.links.slice()) {
      this.dissolveLink(link, "ectomancer_died");
    }
    this.links = [];
    this.removeLightSource(this.lightSource);
    this.lightSource = null;
  };

  /** Called from Enemy.kill on either side of a link to tear it down cleanly. */
  notifyLinkSideDied = (side: Entity) => {
    const link = this.links.find((l) => l.base === side || l.ghost === side);
    if (!link) return;
    this.links = this.links.filter((l) => l !== link);
    if (side === link.base) {
      // Base died — kill the ghost with proper fade animation.
      if (!link.ghost.dead) {
        link.ghost.ectomancerOwner = null;
        link.ghost.kill();
      }
    } else if (side === link.ghost) {
      // Ghost died — un-freeze base.
      if (!link.base.dead) {
        link.base.ghostFrozen = false;
      }
      link.base.ectomancerOwner = null;
    }
  };

  private dissolveLink = (link: EctomancerLink, _reason: string) => {
    if (!link.base.dead) {
      link.base.ghostFrozen = false;
    }
    link.base.ectomancerOwner = null;
    if (!link.ghost.dead) {
      // Clear owner first so kill() doesn't re-enter notifyLinkSideDied.
      link.ghost.ectomancerOwner = null;
      link.ghost.kill();
    } else {
      link.ghost.ectomancerOwner = null;
    }
  };

  behavior = () => {
    this.lastX = this.x;
    this.lastY = this.y;

    let candidates = this.candidates();

    if (!this.dead) {
      if (this.handleSkipTurns()) return;
      this.ticks++;

      this.ghostify(candidates);
      this.prune();

      if (this.links.length > 0) {
        // Move toward the farthest linked base — like exalter/occultist keep proximity.
        let target = this.links.reduce((farthest, current) => {
          const dF = Utils.distance(
            this.x,
            this.y,
            farthest.base.x,
            farthest.base.y,
          );
          const dC = Utils.distance(
            this.x,
            this.y,
            current.base.x,
            current.base.y,
          );
          return dC > dF ? current : farthest;
        }).base;

        let disablePositions = Array<astar.Position>();
        disablePositions.push(...this.getEntityDisablePositions());
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

        const moves = this.searchPathLocalizedCached(
          { x: target.x, y: target.y },
          disablePositions,
        );

        if (moves.length > 0) {
          const oldX = this.x;
          const oldY = this.y;
          const moveX = moves[0].pos.x;
          const moveY = moves[0].pos.y;

          this.tryMove(moveX, moveY);
          this.setDrawXY(oldX, oldY);

          if (this.x > oldX) this.direction = Direction.RIGHT;
          else if (this.x < oldX) this.direction = Direction.LEFT;
          else if (this.y > oldY) this.direction = Direction.DOWN;
          else if (this.y < oldY) this.direction = Direction.UP;
        }
      } else {
        this.runAway();
      }
    }

    if (this.links.length > 0) {
      this.shadeColor = "#3a8174";
    } else {
      this.shadeColor = "#000000";
    }
    if (this.lightSource) {
      this.lightSource.updatePosition(this.x + 0.5, this.y + 0.5);
    }

    this.syncBeams();
  };

  onHurt = (damage: number = 1) => {
    if (
      this.health < this.lastHealth &&
      this.health % 2 === 0 &&
      this.health > 0
    ) {
      this.teleport();
    }
    this.lastHealth = this.health;
  };

  /** Drop any link whose base or ghost is dead (covers off-screen deaths and edge cases). */
  prune = () => {
    const stillAlive: EctomancerLink[] = [];
    for (const link of this.links) {
      if (link.base.dead || link.ghost.dead) {
        if (!link.ghost.dead) {
          link.ghost.ectomancerOwner = null;
          link.ghost.kill();
        } else {
          link.ghost.ectomancerOwner = null;
        }
        if (!link.base.dead) link.base.ghostFrozen = false;
        link.base.ectomancerOwner = null;
        continue;
      }
      stillAlive.push(link);
    }
    this.links = stillAlive;
  };

  /** Filter for enemies eligible to be ghostified by this ectomancer. */
  candidates = (): Enemy[] => {
    const alreadyAnchored = new Set<Enemy>();
    for (const l of this.links) {
      alreadyAnchored.add(l.base);
      alreadyAnchored.add(l.ghost);
    }
    return this.room.entities.filter((entity): entity is Enemy => {
      if (!(entity instanceof Enemy)) return false;
      if (entity === this) return false;
      if (entity.dead) return false;
      if (entity.isGhostly) return false; // never re-ghostify a ghost
      if (entity.ghostFrozen) return false; // already frozen by some ectomancer
      if (entity.ghostifiedBefore) return false; // already had a ghost killed; immune
      if (alreadyAnchored.has(entity)) return false;
      if (entity instanceof EctomancerEnemy) return false;
      // Skip support-caster peers (occultist/exalter set destroyableByOthers=false too);
      // ghostifying a buff caster gets weird fast.
      if (entity.destroyableByOthers === false) return false;
      if (Utils.distance(this.x, this.y, entity.x, entity.y) > this.range)
        return false;
      return true;
    });
  };

  ghostify = (candidates: Enemy[]) => {
    if (this.links.length >= GameplaySettings.MAX_ECTOMANCER_GHOSTS) return;
    for (const base of candidates) {
      if (this.links.length >= GameplaySettings.MAX_ECTOMANCER_GHOSTS) break;
      const distance = Utils.distance(this.x, this.y, base.x, base.y);
      // Same probabilistic gating used by exalter/occultist for cadence consistency.
      if (Random.rand() * 10 > distance) {
        this.tryGhostify(base);
      }
    }
  };

  tryGhostify = (base: Enemy): EctomancerLink | null => {
    const ghost = this.spawnGhostFrom(base);
    if (!ghost) return null;
    base.ghostFrozen = true;
    base.ghostifiedBefore = true;
    base.ectomancerOwner = this;
    ghost.ectomancerOwner = this;
    const link: EctomancerLink = { base, ghost };
    this.links.push(link);
    this.attachBeam(link);
    return link;
  };

  /** Spawn a ghostly copy of `base` on the same tile. */
  spawnGhostFrom = (base: Enemy): Enemy | null => {
    const Ctor = base.constructor as new (
      room: Room,
      game: Game,
      x: number,
      y: number,
    ) => Enemy;

    let ghost: Enemy;
    try {
      ghost = new Ctor(base.room, base.game, base.x, base.y);
    } catch {
      return null;
    }

    this.applyGhostlyState(ghost, base);
    base.room.entities.push(ghost);
    return ghost;
  };

  /** Apply the visual+behavioral tweaks that distinguish a ghost from a real enemy. */
  private applyGhostlyState = (ghost: Enemy, base: Enemy) => {
    ghost.isGhostly = true;
    ghost.alpha = Entity.GHOSTLY_ALPHA;
    ghost.ghostlyBeamParentGid = base.globalId;
    ghost.drops = [];
    ghost.dropChance = 0;
    ghost.enemyKillXpMultiplier = 0;
    ghost.direction = base.direction;
    ghost.health = base.health;
    ghost.maxHealth = base.maxHealth;
    // Give the ghost a target player — fall back to ectomancer's nearest if base hasn't seen one.
    const nearestResult = this.nearestPlayer();
    const player = base.targetPlayer ?? (nearestResult !== false ? nearestResult[1] : null);
    if (player) {
      ghost.targetPlayer = player;
      ghost.seenPlayer = true;
      ghost.aggro = true;
    }
  };

  private beamCenter = (e: Enemy): { x: number; y: number } => ({
    x: e.x + (e.w ?? 1) / 2 - 0.5,
    y: e.y + (e.h ?? 1) / 2 - 0.5,
  });

  attachBeam = (link: EctomancerLink) => {
    const gc = this.beamCenter(link.ghost);
    const bc = this.beamCenter(link.base);
    // Beam parent = ghost so BeamEffect.tick() auto-destroys it when the ghost dies.
    const beam = new BeamEffect(gc.x, gc.y, bc.x, bc.y, link.ghost);
    beam.compositeOperation = "source-over";
    beam.color = "#8FE0D2";
    beam.alpha = 0.35;
    beam.lineWidth = 4;
    beam.turbulence = 0.4;
    beam.gravity = 0.1;
    beam.iterations = 1;
    beam.segments = 100;
    beam.angleChange = 0.001;
    beam.springDamping = 0.01;
    beam.drawableY = link.ghost.drawableY;
    beam.type = "ghost";
    this.room.projectiles.push(beam);
  };

  private syncBeams = () => {
    for (const projectile of this.room.projectiles) {
      if (!(projectile instanceof BeamEffect)) continue;
      if (projectile.type !== "ghost") continue;
      const ghost = projectile.parent;
      if (!(ghost instanceof Enemy)) continue;
      const link = this.links.find((l) => l.ghost === ghost);
      if (!link) continue;
      const gc = this.beamCenter(link.ghost);
      const bc = this.beamCenter(link.base);
      projectile.setTarget(gc.x, gc.y, bc.x, bc.y);
      projectile.drawableY = link.ghost.drawableY;
    }
  };

  teleport = () => {
    const newTile = this.findConstrainedFarTile();
    if (!newTile) return;
    this.drawX = newTile.x - this.x;
    this.drawY = newTile.y - this.y;
    this.x = newTile.x;
    this.y = newTile.y;
    this.lightSource?.updatePosition(this.x + 0.5, this.y + 0.5);
    this.room.updateLighting();
    this.syncBeams();
  };

  private findConstrainedFarTile = () => {
    const emptyTiles = this.room.getEmptyTiles();
    const player = this.getPlayer();
    if (!player || player === false || emptyTiles.length === 0) return null;

    const interactionRange =
      GameplaySettings.MAXIMUM_ENEMY_INTERACTION_DISTANCE;
    const withinPlayerRange = (t: { x: number; y: number }) => {
      const dx = t.x - player.x;
      const dy = t.y - player.y;
      return dx * dx + dy * dy <= interactionRange * interactionRange;
    };

    const linked = this.links.map((l) => l.base);
    const maxLinkedDist = this.range;
    const withinAllLinked = (t: { x: number; y: number }, dist: number) =>
      linked.every((e) => Utils.distance(t.x, t.y, e.x, e.y) <= dist);

    let candidates = emptyTiles.filter(
      (t) =>
        withinPlayerRange(t) &&
        (linked.length === 0 || withinAllLinked(t, maxLinkedDist)),
    );
    if (candidates.length === 0 && linked.length > 0) {
      candidates = emptyTiles.filter(
        (t) => withinPlayerRange(t) && withinAllLinked(t, maxLinkedDist * 2),
      );
    }
    if (candidates.length === 0) {
      candidates = emptyTiles.filter((t) => withinPlayerRange(t));
    }
    if (candidates.length === 0) return null;

    const tilesWithDistances = candidates.map((tile) => {
      const distance = Utils.distance(tile.x, tile.y, player.x, player.y);
      return { tile, distance };
    });
    tilesWithDistances.sort((a, b) => b.distance - a.distance);
    const farTiles = tilesWithDistances.slice(
      0,
      Math.max(1, Math.floor(tilesWithDistances.length / 2)),
    );
    const randomIndex = Math.floor(Random.rand() * farTiles.length);
    return farTiles[randomIndex]?.tile ?? null;
  };

  updateBeam = (delta: number) => {
    for (let beam of this.room.projectiles) {
      if (!(beam instanceof BeamEffect)) continue;
      if (beam.type !== "ghost") continue;
      const link = this.links.find((l) => l.ghost === beam.parent);
      if (!link) continue;
      const gc = this.beamCenter(link.ghost);
      const bc = this.beamCenter(link.base);
      beam.setTarget(
        gc.x - link.ghost.drawX,
        gc.y - link.ghost.drawY,
        bc.x - link.base.drawX,
        bc.y - link.base.drawY,
      );
      beam.drawableY = link.ghost.drawableY;
    }
  };

  draw = (delta: number) => {
    if (this.dead) return;
    Game.ctx.save();
    Game.ctx.globalAlpha = this.alpha;

    this.drawableY = this.y;
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.updateBeam(delta);

      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;

      if (this.hasShadow) this.drawShadow(delta);
      this.drawMobWithCrush(
        this.tileX + Math.floor(this.frame),
        this.tileY,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
        undefined,
        this.outlineColor(),
        this.outlineOpacity(),
      );
    }
    Game.ctx.restore();
  };
}
