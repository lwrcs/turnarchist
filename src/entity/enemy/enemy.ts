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
import { Random } from "../../utility/random";
import { GameplaySettings } from "../../game/gameplaySettings";

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
  protected jumpY: number;
  protected jumpHeight: number;
  static difficulty: number = 1;
  private effectStartTick: number;
  private startTick: number;
  private poisonHitCount: number;
  private bleedHitCount: number;
  protected alertRange: number;
  justHurt: boolean = false;
  orthogonalAttack: boolean;
  diagonalAttack: boolean;
  buffed: boolean;
  buffedBefore: boolean;
  baseDamage: number;

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
    this.orthogonalAttack = false;
    this.diagonalAttack = false;
    this.baseDamage = 1;
    //this.getDrop(["weapon", "equipment", "consumable", "gem", "tool", "coin"]);
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
        // Do not alert freshly spawned enemies that are skipping their next turn
        e.ticks >= 1
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

  tick = () => {
    this.tickPoison();
    this.tickBleed();
    this.behavior();
    if (this.x !== this.lastX || this.y !== this.lastY) {
      this.emitEntityData();
    }
    if (this.shielded) this.shield.updateLightSourcePos();
    this.alertNearbyEnemies();
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
    for (const e of this.room.entities) {
      if (e !== this) {
        disablePositions.push({ x: e.x, y: e.y } as astar.Position);
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
    for (const e of this.room.entities) {
      if (e !== this) {
        disablePositions.push({ x: e.x, y: e.y } as astar.Position);
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
          let disablePositions = Array<astar.Position>();
          for (const e of this.room.entities) {
            if (e !== this) {
              disablePositions.push({ x: e.x, y: e.y } as astar.Position);
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
          let moves = this.searchPathLocalized(
            this.targetPlayer,
            disablePositions,
          );

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

    const w = right - left + 1;
    const h = bottom - top + 1;

    // Build subgrid
    const grid: any[][] = [];
    for (let gx = 0; gx < w; gx++) {
      grid[gx] = [];
      for (let gy = 0; gy < h; gy++) {
        const rx = left + gx;
        const ry = top + gy;
        if (this.room.roomArray[rx] && this.room.roomArray[rx][ry])
          grid[gx][gy] = this.room.roomArray[rx][ry];
        else grid[gx][gy] = false;
      }
    }

    // Translate disables into local grid coordinates; filter to local bounds to avoid large arrays
    const localDisables = (disablePositions || [])
      .filter((p) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom)
      .map((p) => ({ x: p.x - left, y: p.y - top })) as Array<astar.Position>;

    // Localized start/target
    const localStart: any = { ...this, x: this.x - left, y: this.y - top };
    const localTarget: any = {
      ...target,
      x: target.x - left,
      y: target.y - top,
    };

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

  onHurt = (
    damage: number = 1,
    type: "none" | "poison" | "blood" | "heal" = "none",
  ) => {
    if (this.health > 0) {
      if (type === "none") {
        this.justHurt = true;
      }
    }
  };

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

    if (!this.doneMoving()) {
      this.drawX *= this.drawMoveSpeed ** delta;
      this.drawY *= this.drawMoveSpeed ** delta;

      this.drawX = Math.abs(this.drawX) < 0.01 ? 0 : this.drawX;
      this.drawY = Math.abs(this.drawY) < 0.01 ? 0 : this.drawY;
      this.jump(delta);
    }

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
      Game.drawMob(
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
