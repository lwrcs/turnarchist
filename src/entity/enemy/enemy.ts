import { Entity, EntityDirection } from "../entity";
import { Direction, Game } from "../../game";
import { Room } from "../../room/room";
import { Player } from "../../player/player";
import { Item } from "../../item/item";
import { astar } from "../../utility/astarclass";
import { SpikeTrap } from "../../tile/spiketrap";
import { EntityType } from "../entity";
import { ImageParticle } from "../../particle/imageParticle";
import { globalEventBus } from "../../event/eventBus";
import { Sound } from "../../sound/sound";
import { Utils } from "../../utility/utils";
import { Door } from "../../tile/door";
import { StunAnimation } from "../../projectile/stunAnimation";
import { DownLadder } from "../../tile/downLadder";
import { UpLadder } from "../../tile/upLadder";
import { Random } from "../../utility/random";
import { GameplaySettings } from "../../game/gameplaySettings";
import { GameConstants } from "../../game/gameConstants";

enum EnemyState {
  SLEEP,
  AGGRO,
  ATTACK,
  DEAD,
  IDLE,
}

interface EnemyStatus {
  poison: {
    active: boolean;
    hitCount: number;
    startTick: number;
    effectTick: number;
  };
  bleed: {
    active: boolean;
    hitCount: number;
    startTick: number;
    effectTick: number;
  };
}

export abstract class Enemy extends Entity {
  seenPlayer: boolean;
  heardPlayer: boolean;
  frame: number;
  ticks: number;
  aggro: boolean;
  targetPlayer: Player;
  drop: Item;
  status: EnemyStatus;
  protected _jumpY: number;
  protected jumpHeight: number;
  static difficulty: number = 1;
  private effectStartTick: number;
  private startTick: number;
  private poisonHitCount: number;
  private bleedHitCount: number;
  protected alertRange: number;
  justHurt: boolean = false;
  hurtThisTurn: boolean = false;
  orthogonalAttack: boolean;
  diagonalAttack: boolean;
  buffed: boolean;
  buffedBefore: boolean;
  baseDamage: number;
  protected _pathCache: {
    moves: any[];
    targetX: number;
    targetY: number;
    fromX: number;
    fromY: number;
  } | null = null;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.drawYOffset = 1.5;
    this.name = "";
    this.seenPlayer = false;
    this.heardPlayer = false;
    this.ticks = 0;
    this.frame = 0;
    this.health = 1;
    this.maxHealth = 1;
    this.tileX = 17;
    this.tileY = 8;
    this.aggro = false;
    this.jumpY = 0;
    this.jumpHeight = 0.3;
    //this.dir = Direction.South;
    this.name = "generic enemy";
    this.dropChance = 10;
    this.status = {
      poison: { active: false, hitCount: 0, startTick: 0, effectTick: 0 },
      bleed: { active: false, hitCount: 0, startTick: 0, effectTick: 0 },
    };
    this.alertRange = GameplaySettings.BASE_ENEMY_ALERT_RANGE;
    this.effectStartTick = 1;
    this.startTick = 1;
    this.isEnemy = true;
    this.poisonHitCount = 0;
    this.bleedHitCount = 0;
    this.drawMoveSpeed = 0.85; //lower is faster
    this.justHurt = false;
    this.hurtThisTurn = false;
    this.orthogonalAttack = false;
    this.diagonalAttack = false;
    this.baseDamage = 1;
    //this.getDrop(["weapon", "equipment", "consumable", "gem", "tool", "coin"]);
  }

  /**
   * Jump offset accessor.
   * Centralizes "no hop while being pushed" without touching child classes:
   * any render path that reads `this.jumpY` will receive 0 during push animation.
   */
  get jumpY(): number {
    // No hop while being pushed OR while playing the crushed death-clone animation.
    return this.isPushAnimating() || (this.cloned && this.crushed)
      ? 0
      : this._jumpY;
  }
  set jumpY(v: number) {
    this._jumpY = v;
  }

  hit = (): number => {
    return this.damage;
  };

  alertNearbyEnemies = () => {
    if (!this.seenPlayer) return;
    const p = this.nearestPlayer();
    if (p === false) return;
    const enemies = this.room.entities.filter((e) => e instanceof Enemy);
    for (const e of enemies) {
      if (e === this) continue;
      const distance = Utils.distance(this.x, this.y, e.x, e.y);
      if (
        distance <= GameplaySettings.BASE_ENEMY_ALERT_NEARBY_RANGE &&
        e instanceof Enemy &&
        !e.seenPlayer &&
        // Do not alert freshly spawned enemies until they've had a full active (non-skip) tick.
        // Spawner-placed enemies spend their first tick in a skipNextTurns pass (ticks becomes 1);
        // requiring ticks >= 2 ensures they get a genuine wake-up turn before being chain-alerted.
        e.ticks >= 2
      ) {
        e.handleSeenPlayer(p[1], false);
        e.alertTicks = 2;
      }
    }
  };

  get damage() {
    return this.buffed ? 2 * this.baseDamage : this.baseDamage;
  }

  handleEnemyCase = (playerHitBy?: Player) => {
    if (!playerHitBy) return;
    if (playerHitBy) {
      this.aggro = true;
      this.targetPlayer = playerHitBy;
      //this.facePlayer(playerHitBy);
      if (playerHitBy === this.game.players[this.game.localPlayerID])
        this.alertTicks = 2; // this is really 1 tick, it will be decremented immediately in tick()
    }
  };

  poison = () => {
    if (!this.status.poison.active) {
      this.status.poison = {
        active: true,
        hitCount: 0,
        startTick: this.ticks,
        effectTick: this.ticks % 3,
      };
      this.shadeColor = "#00FF00";
    }
  };

  bleed = () => {
    if (!this.status.bleed.active) {
      this.status.bleed = {
        active: true,
        hitCount: 0,
        startTick: this.ticks,
        effectTick: this.ticks % 1,
      };
    }
  };

  /**
   * Placeholder for "curse" weapon status. Intentionally no-op for now.
   * This exists so WeaponCurse can be applied and routed through the same pipeline
   * as poison/bleed without affecting gameplay yet.
   */
  curse = () => {};

  tickPoison = () => {
    if (this.status.poison.active && this.targetPlayer) {
      if (
        this.ticks % 3 === this.status.poison.effectTick &&
        this.ticks !== this.status.poison.startTick &&
        this.health >= 1
      ) {
        this.hurt(this.targetPlayer, 1, "poison");
        this.shadeColor = "#00FF00";
        //this.status.poison.hitCount++;

        /*
        if (this.status.poison.hitCount >= 2) {
          this.status.poison = {
            active: false,
            hitCount: 0,
            startTick: 0,
            effectTick: 0,
          };
        }
        */
      }
    }
  };

  tickBleed = () => {
    if (this.status.bleed.active && this.targetPlayer) {
      if (
        this.ticks % 1 === this.status.bleed.effectTick &&
        this.ticks !== this.status.bleed.startTick
      ) {
        this.hurt(this.targetPlayer, 0.5, "blood");
        //this.targetPlayer.heal(0.5);
        this.shadeColor = "#FF0000";
        this.status.bleed.hitCount++;

        if (this.status.bleed.hitCount >= 4) {
          this.status.bleed = {
            active: false,
            hitCount: 0,
            startTick: 0,
            effectTick: 0,
          };
        }
      }
    }
  };

  lookForPlayer = (face: boolean = true) => {
    if (this.seenPlayer) return;

    const p = this.nearestPlayer();
    if (p === false) return;

    const [distance, player] = p;
    if (distance > this.alertRange) return;

    this.handleSeenPlayer(player, face);

    this.makeHitWarnings();
  };

  handleSeenPlayer = (player: Player, face: boolean = true) => {
    this.targetPlayer = player;
    if (face) this.facePlayer(player);
    this.seenPlayer = true;

    globalEventBus.emit("EnemySeenPlayer", {
      enemyType: this.constructor.name,
      enemyName: this.name,
    });

    if (player === this.game.players[this.game.localPlayerID]) {
      this.alertTicks = 1;
    }
  };

  getDisablePositions = (): Array<astar.Position> => {
    let disablePositions = Array<astar.Position>();
    const mw = this.w ?? 1;
    const mh = this.h ?? 1;
    for (const e of this.room.entities) {
      if (e !== this) {
        const ew = e.w ?? 1;
        const eh = e.h ?? 1;
        for (let dx = 0; dx < ew; dx++) {
          for (let dy = 0; dy < eh; dy++) {
            const tx = e.x + dx;
            const ty = e.y + dy;
            if (tx >= this.x && tx < this.x + mw && ty >= this.y && ty < this.y + mh) continue;
            disablePositions.push({ x: tx, y: ty } as astar.Position);
          }
        }
      }
    }
    for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
      for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
        if (
          this.room.roomArray[xx][yy] instanceof SpikeTrap &&
          (this.room.roomArray[xx][yy] as SpikeTrap).on
        ) {
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
    return disablePositions;
  };

  findPath = () => {
    let disablePositions = Array<astar.Position>();
    const mw = this.w ?? 1;
    const mh = this.h ?? 1;
    for (const e of this.room.entities) {
      if (e !== this) {
        const ew = e.w ?? 1;
        const eh = e.h ?? 1;
        for (let dx = 0; dx < ew; dx++) {
          for (let dy = 0; dy < eh; dy++) {
            const tx = e.x + dx;
            const ty = e.y + dy;
            if (tx >= this.x && tx < this.x + mw && ty >= this.y && ty < this.y + mh) continue;
            disablePositions.push({ x: tx, y: ty } as astar.Position);
          }
        }
      }
    }
    for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
      for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
        if (
          this.room.roomArray[xx][yy] instanceof SpikeTrap &&
          (this.room.roomArray[xx][yy] as SpikeTrap).on
        ) {
          // Don't walk on active spike traps
          disablePositions.push({ x: xx, y: yy } as astar.Position);
        }
      }
    }
    // Use localized pathfinding grid for performance
    this.searchPathLocalized(this.targetPlayer, disablePositions);
  };

  handleSkipTurns = () => {
    if (this.skipNextTurns > 0) {
      if (this.skipNextTurns === 1) this.makeHitWarnings();
      this.skipNextTurns--;
      return true;
    } else return false;
  };

  tick = () => {
    this.tickPoison();
    this.tickBleed();
    if (this.ghostFrozen && !this.dead) {
      this.lastX = this.x;
      this.lastY = this.y;
      this.hurtThisTurn = false;
      return;
    }
    this.behavior();
    if (this.x !== this.lastX || this.y !== this.lastY) {
      this.emitEntityData();
    }
    if (this.shielded) this.shield.updateLightSourcePos();
    this.alertNearbyEnemies();
    this.hurtThisTurn = false;
  };

  behavior = () => {
    // Store the current position
    this.lastX = this.x;
    this.lastY = this.y;

    // If the enemy is not dead
    if (!this.dead) {
      // Skip turns if necessary
      if (this.handleSkipTurns()) return;

      // Increment the tick counter
      this.ticks++;

      // If the enemy has not seen the player yet
      if (!this.seenPlayer) this.lookForPlayer();
      else if (this.seenPlayer) {
        // If the target player has taken their turn
        if (this.room.playerTicked === this.targetPlayer) {
          // Decrement alert ticks
          this.alertTicks = Math.max(0, this.alertTicks - 1);

          // Store the old position
          let oldX = this.x;
          let oldY = this.y;

          // Create a list of positions to avoid
          let disablePositions = this.getEntityDisablePositions();
          for (let xx = this.x - 1; xx <= this.x + 1; xx++) {
            for (let yy = this.y - 1; yy <= this.y + 1; yy++) {
              if (
                this.room.roomArray[xx][yy] instanceof SpikeTrap &&
                (this.room.roomArray[xx][yy] as SpikeTrap).on
              ) {
                // Don't walk on active spike traps
                disablePositions.push({ x: xx, y: yy } as astar.Position);
              }
            }
          }

          // Use cached pathfinding: skips A* when player hasn't moved and next step is clear.
          let moves = this.searchPathLocalizedCached(this.targetPlayer, disablePositions);

          // If there are moves available
          if (moves.length > 0) {
            let moveX = moves[0].pos.x;
            let moveY = moves[0].pos.y;
            let oldDir = this.direction;
            let player = this.targetPlayer;

            // Face the target player
            this.facePlayer(player);

            // Determine the new direction based on the move
            if (moveX > oldX) this.direction = Direction.RIGHT;
            else if (moveX < oldX) this.direction = Direction.LEFT;
            else if (moveY > oldY) this.direction = Direction.DOWN;
            else if (moveY < oldY) this.direction = Direction.UP;

            // If the direction hasn't changed, attempt to move or attack
            if (oldDir == this.direction) {
              let hitPlayer = false;
              for (const i in this.game.players) {
                if (
                  this.game.rooms[this.game.players[i].levelID] === this.room &&
                  this.game.players[i].x === moveX &&
                  this.game.players[i].y === moveY
                ) {
                  // Attack the player if they are in the way
                  if (!this.shouldSkipAttack()) {
                    this.game.players[i].hurt(this.hit(), this.name, {
                      source: { x: this.x, y: this.y },
                    });
                    this.drawX = 0.5 * (this.x - this.game.players[i].x);
                    this.drawY = 0.5 * (this.y - this.game.players[i].y);
                    if (
                      this.game.players[i] ===
                      this.game.players[this.game.localPlayerID]
                    )
                      this.game.shakeScreen(10 * this.drawX, 10 * this.drawY);
                  }
                }
              }
              if (!hitPlayer) {
                // Move to the new position
                this.tryMove(moveX, moveY);
                this.setDrawXY(moveX, moveY);
                if (this.x > moveX) this.direction = Direction.RIGHT;
                else if (this.x < moveX) this.direction = Direction.LEFT;
                else if (this.y > moveY) this.direction = Direction.DOWN;
                else if (this.y < moveY) this.direction = Direction.UP;
              }
            }
          }

          // Add positions to avoid based on the current direction
          if (this.direction == Direction.LEFT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == Direction.RIGHT) {
            disablePositions.push({
              x: this.x,
              y: this.y + 1,
            } as astar.Position);
            disablePositions.push({
              x: this.x,
              y: this.y - 1,
            } as astar.Position);
          }
          if (this.direction == Direction.DOWN) {
            disablePositions.push({
              x: this.x + 1,
              y: this.y,
            } as astar.Position);
            disablePositions.push({
              x: this.x - 1,
              y: this.y,
            } as astar.Position);
          }
          if (this.direction == Direction.UP) {
            disablePositions.push({
              x: this.x + 1,
              y: this.y,
            } as astar.Position);
            disablePositions.push({
              x: this.x - 1,
              y: this.y,
            } as astar.Position);
          }
          // Make hit warnings
          this.makeHitWarnings();
        }

        // Check if the target player is offline
        let targetPlayerOffline =
          Object.values(this.game.offlinePlayers).indexOf(this.targetPlayer) !==
          -1;
        // If the enemy is not aggro or the target player is offline, find a new target player
        if (!this.aggro || targetPlayerOffline) {
          let p = this.nearestPlayer();
          if (p !== false) {
            let [distance, player] = p;
            if (
              distance <= 4 &&
              (targetPlayerOffline ||
                distance < this.playerDistance(this.targetPlayer))
            ) {
              if (player !== this.targetPlayer) {
                this.targetPlayer = player;
                this.facePlayer(player);
                if (player === this.game.players[this.game.localPlayerID])
                  this.alertTicks = 1;
                this.makeHitWarnings();
              }
            }
          }
        }
      }
    }
  };

  // For multi-tile enemies, expand disable positions so that every top-left anchor
  // whose footprint would overlap a disabled tile is also disabled.
  // For 1x1 enemies the inner loops are single-iteration — returns the input unchanged.
  protected expandDisablesForFootprint(
    positions: Array<astar.Position>,
  ): Array<astar.Position> {
    const selfW = this.w ?? 1;
    const selfH = this.h ?? 1;
    if (selfW <= 1 && selfH <= 1) return positions;

    const out: Array<astar.Position> = [];
    const seen = new Set<number>();

    for (const p of positions) {
      for (let fx = 0; fx < selfW; fx++) {
        for (let fy = 0; fy < selfH; fy++) {
          const bx = p.x - fx;
          const by = p.y - fy;
          const key = bx * 100000 + by;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ x: bx, y: by } as astar.Position);
        }
      }
    }

    return out;
  }

  // Build disable positions for all entities in the room, expanding multi-tile entities
  // to cover every tile they occupy (not just the top-left anchor).
  protected getEntityDisablePositions(filter?: (e: Entity) => boolean): Array<astar.Position> {
    const out: Array<astar.Position> = [];
    const mw = this.w ?? 1;
    const mh = this.h ?? 1;
    for (const e of this.room.entities) {
      if (e === this) continue;
      if (filter && !filter(e)) continue;
      const ew = e.w ?? 1;
      const eh = e.h ?? 1;
      for (let dx = 0; dx < ew; dx++) {
        for (let dy = 0; dy < eh; dy++) {
          const tx = e.x + dx;
          const ty = e.y + dy;
          // Skip tiles that are inside our own current footprint — we're vacating
          // them, so they shouldn't count as blocked for pathfinding purposes.
          if (tx >= this.x && tx < this.x + mw && ty >= this.y && ty < this.y + mh) continue;
          out.push({ x: tx, y: ty } as astar.Position);
        }
      }
    }
    return out;
  }

  // Cached variant of searchPathLocalized. Reuses the A* path across turns by tracking
  // whether the enemy moved since the last compute. Three cases:
  //   - Stayed in place (attacked, blocked): fromX/Y matches current pos → reuse same path
  //   - Moved to moves[0]: advance path by one step
  //   - Moved elsewhere (knockback): cache miss, run fresh A*
  protected searchPathLocalizedCached(
    target: { x: number; y: number },
    disablePositions: Array<astar.Position>,
    options?: Parameters<Enemy["searchPathLocalized"]>[2],
  ): any[] {
    // Expand disable positions for multi-tile enemies so all overlapping
    // top-left anchors are blocked, not just the exact entity tile.
    disablePositions = this.expandDisablesForFootprint(disablePositions);

    const cache = this._pathCache;

    if (cache !== null && cache.targetX === target.x && cache.targetY === target.y) {
      let candidate: any[] | null = null;

      if (cache.fromX === this.x && cache.fromY === this.y) {
        // Stayed in place since last compute (attacked, blocked) — reuse same path.
        candidate = cache.moves;
      } else if (
        cache.moves.length >= 1 &&
        cache.moves[0].pos.x === this.x &&
        cache.moves[0].pos.y === this.y
      ) {
        // Moved to moves[0] — advance path.
        candidate = cache.moves.slice(1);
      }
      // else: moved somewhere unexpected (knockback) → cache miss

      if (candidate !== null) {
        if (candidate.length === 0) {
          this._pathCache = null;
          return [];
        }
        const next = candidate[0];
        if (!disablePositions.some((p) => p.x === next.pos.x && p.y === next.pos.y)) {
          this._pathCache = {
            moves: candidate,
            targetX: target.x,
            targetY: target.y,
            fromX: this.x,
            fromY: this.y,
          };
          return candidate;
        }
      }
    }

    // Cache miss — run A*.
    const moves = this.searchPathLocalized(target, disablePositions, options);
    this._pathCache =
      moves.length > 0
        ? { moves, targetX: target.x, targetY: target.y, fromX: this.x, fromY: this.y }
        : null;
    return moves;
  }

  // Build a localized search grid around enemy and target and run A*
  protected searchPathLocalized(
    target: { x: number; y: number },
    disablePositions: Array<astar.Position>,
    options?: {
      diagonals?: boolean;
      diagonalsOnly?: boolean;
      allowOmni?: boolean;
      direction?: Direction;
      useLastPlayerPos?: boolean;
      lastPlayerPos?: { x: number; y: number };
    },
  ) {
    const pad = 3; // extra wiggle room
    const minSide = GameplaySettings.MAXIMUM_ENEMY_INTERACTION_DISTANCE;

    const minX = Math.min(this.x, target.x);
    const maxX = Math.max(this.x, target.x);
    const minY = Math.min(this.y, target.y);
    const maxY = Math.max(this.y, target.y);

    let left = Math.max(this.room.roomX, minX - pad);
    let right = Math.min(this.room.roomX + this.room.width - 1, maxX + pad);
    let top = Math.max(this.room.roomY, minY - pad);
    let bottom = Math.min(this.room.roomY + this.room.height - 1, maxY + pad);

    // Enforce minimum rectangle size centered between enemy and target
    const cx = Math.floor((this.x + target.x) / 2);
    const cy = Math.floor((this.y + target.y) / 2);
    const half = Math.floor(minSide / 2);
    left = Math.min(left, cx - half);
    right = Math.max(right, cx + half);
    top = Math.min(top, cy - half);
    bottom = Math.max(bottom, cy + half);

    // Clamp to room bounds
    left = Math.max(this.room.roomX, left);
    right = Math.min(this.room.roomX + this.room.width - 1, right);
    top = Math.max(this.room.roomY, top);
    bottom = Math.min(this.room.roomY + this.room.height - 1, bottom);

    // Hard cap: prevent O(n²) A* when enemy and player are very far apart in large rooms.
    const MAX_PATH_DIM = 36;
    if (right - left + 1 > MAX_PATH_DIM) {
      const excess = right - left + 1 - MAX_PATH_DIM;
      left += Math.floor(excess / 2);
      right = left + MAX_PATH_DIM - 1;
      // Snap so the enemy's start is always inside the grid (negative localStart.x breaks A*).
      if (this.x < left) { right -= left - this.x; left = this.x; }
      else if (this.x > right) { left += this.x - right; right = this.x; }
    }
    if (bottom - top + 1 > MAX_PATH_DIM) {
      const excess = bottom - top + 1 - MAX_PATH_DIM;
      top += Math.floor(excess / 2);
      bottom = top + MAX_PATH_DIM - 1;
      if (this.y < top) { bottom -= top - this.y; top = this.y; }
      else if (this.y > bottom) { top += this.y - bottom; bottom = this.y; }
    }

    const w = right - left + 1;
    const h = bottom - top + 1;

    const selfW = this.w ?? 1;
    const selfH = this.h ?? 1;
    const selfZ = this.z ?? 0;

    const footprintFitsAt = (rx: number, ry: number): boolean => {
      // Ensure the whole footprint exists and is walkable for this entity's z-layer.
      for (let dx = 0; dx < selfW; dx++) {
        for (let dy = 0; dy < selfH; dy++) {
          const x = rx + dx;
          const y = ry + dy;
          const tile = this.room.roomArray[x]?.[y];
          if (!tile) return false;
          if (this.room.isSolidAt(x, y, selfZ)) return false;
          if (tile instanceof Door) return false;
          if (tile instanceof DownLadder) return false;
          if (tile instanceof UpLadder) return false;
        }
      }
      return true;
    };

    // Build subgrid
    const grid: any[][] = [];
    for (let gx = 0; gx < w; gx++) {
      grid[gx] = [];
      for (let gy = 0; gy < h; gy++) {
        const rx = left + gx;
        const ry = top + gy;
        // IMPORTANT: for 2x2+ enemies, a path node represents the *top-left* tile of the footprint.
        // Mark nodes as blocked when the full footprint cannot legally occupy that position.
        // Use `null` as a hard-block sentinel so A* will treat this as impassable,
        // even though the global cost model uses "very expensive" for `false`.
        grid[gx][gy] = footprintFitsAt(rx, ry)
          ? this.room.roomArray[rx][ry]
          : null;
      }
    }

    // Translate disables into local grid coordinates; filter to local bounds to avoid large arrays
    const localDisables = (disablePositions || [])
      .filter((p) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom)
      .map((p) => ({ x: p.x - left, y: p.y - top })) as Array<astar.Position>;

    // For multi-tile enemies, hard-block disable positions in the grid so A* treats
    // entity-occupied anchors as truly impassable (not just expensive).
    if (selfW > 1 || selfH > 1) {
      for (const dp of localDisables) {
        if (dp.x >= 0 && dp.x < w && dp.y >= 0 && dp.y < h) {
          grid[dp.x][dp.y] = null;
        }
      }
      // Clear so A* constructor doesn't double-apply them as cost 99999999
      localDisables.length = 0;
    }

    // Localized start/target
    const localStart: any = { ...this, x: this.x - left, y: this.y - top };
    let localTarget: any = {
      ...target,
      x: target.x - left,
      y: target.y - top,
    };

    const inLocalBounds = (lx: number, ly: number): boolean =>
      lx >= 0 && lx < w && ly >= 0 && ly < h;
    const isLocalNodeWalkable = (lx: number, ly: number): boolean => {
      if (!inLocalBounds(lx, ly)) return false;
      const node = grid[lx]?.[ly];
      return node !== false && node !== undefined && node !== null;
    };

    // For 2x2+ enemies, the player's exact (x,y) may not be a valid top-left anchor for the
    // enemy footprint (e.g. player standing near a wall). If the target node is blocked,
    // retarget to the nearest valid top-left that would still allow us to approach/overlap.
    if (!isLocalNodeWalkable(localTarget.x, localTarget.y)) {
      let best: { x: number; y: number; d: number } | null = null;

      // Prefer anchors that would place the target point inside our footprint (overlap candidates).
      for (let ox = 0; ox < selfW; ox++) {
        for (let oy = 0; oy < selfH; oy++) {
          const worldX = target.x - ox;
          const worldY = target.y - oy;
          const lx = worldX - left;
          const ly = worldY - top;
          if (!isLocalNodeWalkable(lx, ly)) continue;
          const d =
            Math.abs(lx - localStart.x) + Math.abs(ly - localStart.y);
          if (!best || d < best.d) best = { x: lx, y: ly, d };
        }
      }

      // If no overlap anchor is valid, fall back to the nearest walkable local node around the target.
      if (!best) {
        const maxR = Math.max(w, h);
        for (let r = 1; r <= maxR && !best; r++) {
          for (let dx = -r; dx <= r; dx++) {
            const dyAbs = r - Math.abs(dx);
            const candidates: Array<{ x: number; y: number }> = [
              { x: localTarget.x + dx, y: localTarget.y + dyAbs },
              { x: localTarget.x + dx, y: localTarget.y - dyAbs },
            ];
            for (const c of candidates) {
              if (!isLocalNodeWalkable(c.x, c.y)) continue;
              best = { x: c.x, y: c.y, d: r };
              break;
            }
            if (best) break;
          }
        }
      }

      if (best) {
        localTarget = { ...localTarget, x: best.x, y: best.y };
      } else {
        // No reachable target cell in the local grid — skip pathfinding.
        return [];
      }
    }

    // Guard: target must be within local grid bounds before passing to A*.
    if (!inLocalBounds(localTarget.x, localTarget.y)) {
      return [];
    }

    // Optionally include lastPlayerPos in local space for search variants that support it
    const localLast = options?.useLastPlayerPos
      ? options?.lastPlayerPos
        ? {
            x: options.lastPlayerPos.x - left,
            y: options.lastPlayerPos.y - top,
          }
        : this.targetPlayer
          ? {
              x: this.targetPlayer.lastX - left,
              y: this.targetPlayer.lastY - top,
            }
          : undefined
      : undefined;

    // Run A* (two common signatures)
    let moves: any[];
    if (options?.useLastPlayerPos) {
      // grid, start, target, disables, diagonals, diagonalsOnly, (unused), (unused), (unused), diagonalsOmni=false, lastPlayerPos
      moves = astar.AStar.search(
        grid,
        localStart,
        localTarget,
        localDisables,
        options?.diagonals ?? false,
        options?.diagonalsOnly ?? false,
        false,
        undefined,
        undefined,
        false,
        localLast,
      );
    } else {
      // grid, start, target, disables, diagonals, diagonalsOnly, allowOmni, direction
      moves = astar.AStar.search(
        grid,
        localStart,
        localTarget,
        localDisables,
        options?.diagonals ?? false,
        options?.diagonalsOnly ?? false,
        options?.allowOmni ?? true,
        options?.direction ?? this.direction,
      );
    }

    // Map moves back to room coordinates
    for (const m of moves) {
      m.pos.x = m.pos.x + left;
      m.pos.y = m.pos.y + top;
    }
    return moves;
  }

  /**
   * Compute the same bounds used by `searchPathLocalized()` without building the grid.
   * Useful for generating a *small* disablePositions list that won't be filtered away later.
   */
  protected getSearchPathLocalizedBounds = (
    target: { x: number; y: number },
    options?: { pad?: number; minSide?: number },
  ): { left: number; right: number; top: number; bottom: number } => {
    const pad = options?.pad ?? 3;
    const minSide =
      options?.minSide ?? GameplaySettings.MAXIMUM_ENEMY_INTERACTION_DISTANCE;

    const minX = Math.min(this.x, target.x);
    const maxX = Math.max(this.x, target.x);
    const minY = Math.min(this.y, target.y);
    const maxY = Math.max(this.y, target.y);

    let left = Math.max(this.room.roomX, minX - pad);
    let right = Math.min(this.room.roomX + this.room.width - 1, maxX + pad);
    let top = Math.max(this.room.roomY, minY - pad);
    let bottom = Math.min(this.room.roomY + this.room.height - 1, maxY + pad);

    // Enforce minimum rectangle size centered between enemy and target
    const cx = Math.floor((this.x + target.x) / 2);
    const cy = Math.floor((this.y + target.y) / 2);
    const half = Math.floor(minSide / 2);
    left = Math.min(left, cx - half);
    right = Math.max(right, cx + half);
    top = Math.min(top, cy - half);
    bottom = Math.max(bottom, cy + half);

    // Clamp to room bounds
    left = Math.max(this.room.roomX, left);
    right = Math.min(this.room.roomX + this.room.width - 1, right);
    top = Math.max(this.room.roomY, top);
    bottom = Math.min(this.room.roomY + this.room.height - 1, bottom);

    return { left, right, top, bottom };
  };

  /**
   * Build a localized list of blocked positions for A* by scanning entities whose footprints
   * intersect the localized grid bounds. This avoids building an O(entityCount) list for the
   * whole room and then filtering most of it away.
   */
  protected buildEntityDisablePositionsLocalized = (
    target: { x: number; y: number },
    shouldBlock: (e: Entity) => boolean,
  ): Array<astar.Position> => {
    const { left, right, top, bottom } =
      this.getSearchPathLocalizedBounds(target);
    const out: Array<astar.Position> = [];

    for (const e of this.room.entities) {
      if (!shouldBlock(e)) continue;
      const w = e.w || 1;
      const h = e.h || 1;

      // quick reject: no bounding-box intersection with the localized region
      const ex0 = e.x;
      const ey0 = e.y;
      const ex1 = e.x + w - 1;
      const ey1 = e.y + h - 1;
      if (ex1 < left || ex0 > right || ey1 < top || ey0 > bottom) continue;

      const mw = this.w ?? 1;
      const mh = this.h ?? 1;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          const x = e.x + dx;
          const y = e.y + dy;
          if (x < left || x > right || y < top || y > bottom) continue;
          if (x >= this.x && x < this.x + mw && y >= this.y && y < this.y + mh) continue;
          out.push({ x, y } as astar.Position);
        }
      }
    }

    return out;
  };

  onHurt = (
    damage: number = 1,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    if (this.health > 0) {
      if (type === "none") {
        this.justHurt = true;
        this.hurtThisTurn = true;
      }
    }
  };

  /**
   * Returns true if this enemy should skip its attack this turn because it was
   * hit by the player. Consuming the flag here resets it so it doesn't persist.
   * Only active when GameplaySettings.HIT_STUNS_ATTACK is enabled.
   */
  protected shouldSkipAttack(): boolean {
    if (!GameplaySettings.HIT_STUNS_ATTACK) return false;
    const skip = this.hurtThisTurn;
    this.hurtThisTurn = false;
    return skip;
  }

  stun = () => {
    if (this.stunned) return;
    this.stunned = true;
    this.unconscious = true;
    new StunAnimation(this, this.x, this.y);
  };

  retreat = (oldX: number, oldY: number) => {
    // Calculate direction vector from player to enemy
    let dx = this.x - this.targetPlayer.x;
    let dy = this.y - this.targetPlayer.y;

    // Normalize the direction vector
    let length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx = Math.round(dx / length);
      dy = Math.round(dy / length);
    }

    let retreatX = this.x;
    let retreatY = this.y;
    let foundValidRetreat = false;

    // Determine retreat behavior based on attack properties
    if (this.orthogonalAttack && this.diagonalAttack) {
      // Both enabled: use current behavior (try orthogonal first, then diagonal)
      retreatX = this.x + dx;
      retreatY = this.y + dy;

      if (this.room.isTileEmpty(retreatX, retreatY)) {
        foundValidRetreat = true;
      } else {
        // Try diagonal positions
        if (dy === 0) dy = Random.rand() < 0.5 ? 1 : -1;
        if (dx === 0) dx = Random.rand() < 0.5 ? 1 : -1;
        let diagonal1X = this.x - dy;
        let diagonal1Y = this.y + dx;
        let diagonal2X = this.x + dy;
        let diagonal2Y = this.y - dx;

        // Randomly choose which diagonal to check first
        let checkFirst = Random.rand() < 0.5;
        let firstX = checkFirst ? diagonal1X : diagonal2X;
        let firstY = checkFirst ? diagonal1Y : diagonal2Y;
        let secondX = checkFirst ? diagonal2X : diagonal1X;
        let secondY = checkFirst ? diagonal2Y : diagonal1Y;

        // Check first diagonal
        if (this.room.isTileEmpty(firstX, firstY)) {
          retreatX = firstX;
          retreatY = firstY;
          foundValidRetreat = true;
        }
        // Check second diagonal if first is blocked
        else if (this.room.isTileEmpty(secondX, secondY)) {
          retreatX = secondX;
          retreatY = secondY;
          foundValidRetreat = true;
        }
      }
    } else if (this.orthogonalAttack) {
      // Only orthogonal retreat allowed
      retreatX = this.x + dx;
      retreatY = this.y + dy;

      if (this.room.isTileEmpty(retreatX, retreatY)) {
        foundValidRetreat = true;
      }
    } else if (this.diagonalAttack) {
      if (dy === 0) dy = Random.rand() < 0.5 ? 1 : -1;
      if (dx === 0) dx = Random.rand() < 0.5 ? 1 : -1;
      // Only diagonal retreat allowed
      let diagonal1X = this.x - dy;
      let diagonal1Y = this.y + dx;
      let diagonal2X = this.x + dy;
      let diagonal2Y = this.y - dx;

      // Randomly choose which diagonal to check first
      let checkFirst = Random.rand() < 0.5;
      let firstX = checkFirst ? diagonal1X : diagonal2X;
      let firstY = checkFirst ? diagonal1Y : diagonal2Y;
      let secondX = checkFirst ? diagonal2X : diagonal1X;
      let secondY = checkFirst ? diagonal2Y : diagonal1Y;

      // Check first diagonal
      if (this.room.isTileEmpty(firstX, firstY)) {
        retreatX = firstX;
        retreatY = firstY;
        foundValidRetreat = true;
      }
      // Check second diagonal if first is blocked
      else if (this.room.isTileEmpty(secondX, secondY)) {
        retreatX = secondX;
        retreatY = secondY;
        foundValidRetreat = true;
      }
    }
    // If neither orthogonalAttack nor diagonalAttack is true, don't retreat

    // Only move if we found a valid retreat position
    if (foundValidRetreat) {
      this.tryMove(retreatX, retreatY);
      this.setDrawXY(oldX, oldY);
    }

    this.justHurt = false;
  };

  jump = (delta: number) => {
    let j = Math.max(Math.abs(this.drawX), Math.abs(this.drawY));
    this.jumpY = Math.abs(Math.sin(j * Math.PI)) * this.jumpHeight;
    if (this.jumpY < 0.01) this.jumpY = 0;
    if (this.jumpY > this.jumpHeight) this.jumpY = this.jumpHeight;
  };

  updateDrawXY = (delta: number) => {
    //putting this here bc i'm lazy
    this.updateHurtFrame(delta);
    this.animateDying(delta);
    this.updateCrushAnimation(delta);

    if (!this.doneMoving()) {
      const isBeingPushed = this.isPushAnimating();
      const speed = isBeingPushed
        ? this.getPushEaseInDecayBase()
        : this.drawMoveSpeed;

      this.drawX *= speed ** delta;
      this.drawY *= speed ** delta;

      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
      this.jump(delta);
    }
    this.updatePushAnimFlag();

    this.updateShadeColor(delta);
  };

  setDrawXY = (x: number, y: number) => {
    this.drawX += this.x - x;
    this.drawY += this.y - y;
  };

  get lastPlayerPos() {
    return {
      x: this.targetPlayer.lastX,
      y: this.targetPlayer.lastY,
    };
  }

  teleport = () => {
    let newTile = this.findFarTile();
    if (newTile) {
      this.drawX = newTile.x - this.x;
      this.drawY = newTile.y - this.y;

      this.x = newTile.x;
      this.y = newTile.y;
      this.lightSource?.updatePosition(this.x + 0.5, this.y + 0.5);
      this.room.updateLighting();
    }
  };

  findFarTile = () => {
    // Get all empty tiles
    const emptyTiles = this.room.getEmptyTiles();
    const player = this.getPlayer();
    // Early return if no player or no empty tiles
    if (!player || emptyTiles.length === 0) {
      return null;
    }

    // Calculate distances from player
    const tilesWithDistances = emptyTiles.map((tile) => {
      const distance = Utils.distance(tile.x, tile.y, player.x, player.y);
      return { tile, distance };
    });

    // Sort by distance (farthest first)
    tilesWithDistances.sort((a, b) => b.distance - a.distance);

    // Take only the 50% farthest tiles
    const farTiles = tilesWithDistances.slice(
      0,
      Math.floor(tilesWithDistances.length / 2),
    );

    // If no far tiles available, return null
    if (farTiles.length === 0) {
      return null;
    }

    // Choose a random tile from the far tiles
    const randomIndex = Math.floor(Random.rand() * farTiles.length);
    return farTiles[randomIndex].tile;
  };

  draw = (delta: number) => {
    if (!this.dead) {
      this.updateDrawXY(delta);
      this.frame += 0.1 * delta;
      if (this.frame >= 4) this.frame = 0;
      if (this.hasShadow) this.drawShadow(delta);

      this.drawMobWithCrush(
        this.tileX + Math.floor(this.frame),
        this.tileY + this.direction * 2,
        1,
        2,
        this.x - this.drawX,
        this.y - this.drawYOffset - this.drawY - this.jumpY,
        1,
        2,
        this.softShadeColor,
        this.shadeAmount(),
      );
    }
    if (!this.dying) {
      if (!this.seenPlayer) {
        this.drawSleepingZs(delta);
      }
      if (this.alertTicks > 0) {
        this.drawExclamation(delta);
      }
    }
  };

  get type() {
    return EntityType.ENEMY;
  }
}
