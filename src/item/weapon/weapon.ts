import { Room } from "../../room/room";
import { Game } from "../../game";
import { Equippable } from "../equippable";
import { Sound } from "../../sound/sound";
import { SlashParticle } from "../../particle/slashParticle";
import type { Entity } from "../../entity/entity";
import { GameConstants } from "../../game/gameConstants";
import { WeaponFragments } from "../usable/weaponFragments";
import { Enemy } from "../../entity/enemy/enemy";
import { AttackAnimation } from "../../particle/attackAnimation";
import { Direction } from "../../game";
import { Armor } from "../armor";
import { computePushChain, applyPushChain } from "../../utility/pushChain";

interface WeaponStatus {
  poison: boolean;
  blood: boolean;
}

export abstract class Weapon extends Equippable {
  game: Game;
  range: number;
  canMine: boolean;
  damage: number;
  status: WeaponStatus;
  static itemName = "weapon";
  name: string;
  statusApplicationCount: number;
  hitDelay: number;
  cooldown: number;
  cooldownMax: number;
  twoHanded: boolean;
  knockbackDistance: number;
  private _swingHitIds: Set<string> | null;
  constructor(level: Room, x: number, y: number, status?: WeaponStatus) {
    super(level, x, y);

    if (level) this.game = level.game;

    this.canMine = false;
    this.range = 1;
    this.damage = 1;
    this.status = status || { poison: false, blood: false };
    this.durability = 50;
    this.durabilityMax = 50;
    this.statusApplicationCount = 0;
    this.equipTick = true;
    this.name = this.constructor.prototype.itemName;
    this.cooldown = 0;
    this.cooldownMax = 0;
    this.twoHanded = false;
    this.knockbackDistance = 0;
    this._swingHitIds = null;
  }
  hoverText = () => {
    //return "Equip " + this.name;
    return this.name;
  };
  break = () => {
    this.durability = 0;
    this.wielder.inventory.weapon = null;
    this.toggleEquip();
    //this.wielder.inventory.removeItem(this);
    //this.wielder = null;
    this.game.pushMessage("Your weapon breaks");
    if (this.status.poison || this.status.blood) {
      this.clearStatus();
    }
    this.broken = true;
  };

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Weapon) return false;
    //if (other instanceof Armor && this.twoHanded) return false;
    return true;
  };

  applyStatus = (status: WeaponStatus) => {
    this.status = status;
    if (this.status.blood) {
      //this.damage = Math.max(0.5, this.damage - 0.5);
    }
  };

  clearStatus = () => {
    const status = this.status.poison ? "poison" : "bleed";
    this.game.pushMessage(`Your ${this.name}'s ${status} effect dries up`);

    this.status = { poison: false, blood: false };
    this.statusApplicationCount = 0;
  };

  statusEffect = (entity: Entity) => {
    if (!entity.isEnemy) return;
    const enemy = entity as Enemy;
    if (!enemy.status.poison.active && !enemy.status.bleed.active) {
      if (this.wielder.applyStatus(enemy, this.status) && enemy.health > 0) {
        this.statusApplicationCount++;
        const message = this.status.poison
          ? `Your weapon poisons the ${enemy.name}`
          : `Your cursed weapon draws blood from the ${enemy.name}`;

        //this.game.pushMessage(message);

        //if (this.statusApplicationCount >= 10) this.clearStatus();
      }
    }
  };

  disassemble = () => {
    if (!this.degradeable) {
      this.game.pushMessage(
        "You can't disassemble this item because it's not degradeable.",
      );
      return;
    }
    if (this.equipped) {
      this.game.pushMessage(
        "I should probably unequip this before I try to disassemble it...",
      );
      return;
    }
    this.game.pushMessage(`You dissassemble your ${this.name} into fragments.`);

    let inventory = this.wielder.inventory;
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.floor(this.durability / 1.5);
    this.toggleEquip();
    //inventory.weapon = null;
    inventory.removeItem(this);
    inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY),
      numFragments,
    );
  };

  dropFromInventory = () => {
    if (this.wielder.inventory.weapon === this)
      this.wielder.inventory.weapon = null;
    this.wielder = null;
    this.equipped = false;
  };

  checkForCollidables = (x: number, y: number): boolean => {
    for (const e of this.getEntitiesAt(x, y)) {
      if (e.collidable === true) {
        return true;
      }
    }
    return false;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    if (this.checkForPushables(newX, newY)) return true;

    // Knockback-enabled weapons attempt a push on enemies before regular attack
    if (this.knockbackDistance > 0 && this.attemptKnockback(newX, newY)) {
      return false;
    }

    const hitSomething = this.executeAttack(newX, newY);

    return !hitSomething;
  };

  /**
   * For UI (context menu) only: determine whether a target tile is in-range for this weapon,
   * without consuming turns or changing any gameplay behavior.
   *
   * Default = cardinal line attack up to `this.range`, matching `Player.enemyInRange`.
   * Subclasses (e.g. Spellbook) can override.
   */
  isTargetInRange = (targetX: number, targetY: number): boolean => {
    const p = this.wielder;
    if (!p) return false;
    return p.enemyInRange(targetX, targetY, this.range);
  };

  /**
   * For UI (context menu) only: compute the input tile (newX/newY) that should be fed into
   * `weaponMove()` to attempt to attack the given target.
   *
   * Default: one step in the cardinal direction toward the target (works for spear etc).
   * Returns null for diagonal targets.
   */
  getAttackInputTileForTarget = (
    targetX: number,
    targetY: number,
  ): { x: number; y: number } | null => {
    const p = this.wielder;
    if (!p) return null;
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    if (dx !== 0 && dy !== 0) return null;
    if (dx === 0 && dy === 0) return null;
    const sx = dx === 0 ? 0 : dx > 0 ? 1 : -1;
    const sy = dy === 0 ? 0 : dy > 0 ? 1 : -1;
    return { x: p.x + sx, y: p.y + sy };
  };

  attack = (enemy: Entity, damage?: number) => {
    if (!this.shouldHitEntity(enemy)) return;
    enemy.hurt(this.wielder, damage || this.damage);
    this.statusEffect(enemy);
  };

  attackAnimation = (newX: number, newY: number) => {
    this.wielder.setHitXY(newX, newY);

    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game?.rooms?.[this.wielder.levelID];
    if (!room) {
      console.error("🔫 WEAPON: Cannot add particle - invalid room state");
      return;
    }
    room.particles.push(
      new AttackAnimation(newX, newY, this.name, this.wielder.direction),
    );
  };

  shakeScreen = (eX: number, eY: number) => {
    const wielderRoom = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.wielder.game.rooms[this.wielder.levelID];
    if (wielderRoom === this.wielder.game.room)
      this.wielder.shakeScreen(this.wielder.x, this.wielder.y, eX, eY);
  };

  hitSound = () => {
    Sound.swing();
    Sound.hit();
  };

  drawStatus = (x: number, y: number) => {
    if (this.status.poison || this.status.blood) {
      let tileX = 3;
      if (this.status.poison) {
        tileX = 4;
      }
      if (this.status.blood) {
        tileX = 3;
      }

      Game.drawFX(
        tileX,
        0,
        1,
        1,
        x - 1 / GameConstants.TILESIZE,
        y - 1 / GameConstants.TILESIZE,
        1,
        1,
      );
    }
  };

  getDescription = (): string => {
    let broken = this.broken ? " (broken)" : "";
    let status = [];
    let durability = "";
    if (this.status.poison) status.push("Poison");
    if (this.status.blood) status.push(" Bleed");
    if (this.durability < this.durabilityMax)
      durability = ` Durability: ${this.durability}/${this.durabilityMax}`;
    return `${this.name}${broken}\n${status.join(", ")}\n${durability}\n${this.description}\ndamage: ${this.damage}`;
  };

  tick = () => {
    this.updateCooldown();
  };

  updateCooldown = () => {
    if (this.cooldown > 0) {
      this.cooldown--;
      if (this.cooldown > 0 && this.equipped) {
        this.equipped = false;
        const hasPreviousWeapon = this.wielder.inventory.items.some(
          (item) => item === this.previousWeapon,
        );
        if (
          hasPreviousWeapon &&
          this.previousWeapon !== null &&
          this.previousWeapon.broken === false &&
          this.previousWeapon.cooldown === 0
        ) {
          this.wielder.inventory.weapon = this.previousWeapon;
          this.previousWeapon.equipped = true;
        } else {
          this.wielder.inventory.weapon = null;
        }
      }
    }
  };

  // returns true if nothing was hit, false if the player should move

  protected getEntitiesAt(x: number, y: number): Entity[] {
    if (!this.game) {
      console.error("🔫 WEAPON: this.game is undefined");
      return [];
    }

    if (!this.wielder) {
      console.error("🔫 WEAPON: this.wielder is undefined");
      return [];
    }

    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game?.rooms?.[this.wielder.levelID];
    if (!room) {
      console.error("🔫 WEAPON: current room is undefined");
      return [];
    }

    const z = this.wielder?.z ?? 0;
    // Z: weapons only interact with entities on the wielder's z-layer.
    return room.entities.filter(
      (e) => e.destroyable && e.pointIn(x, y) && (e?.z ?? 0) === z,
    );
  }

  protected hitEntitiesAt(x: number, y: number, damage?: number): boolean {
    const entities = this.getEntitiesAt(x, y).filter((e) => !e.pushable);
    let hitSomething = false;

    for (const entity of entities) {
      this.attack(entity, damage);
      hitSomething = true;
    }

    return hitSomething;
  }

  protected checkForPushables(x: number, y: number): boolean {
    const direction = this.wielder.direction;
    let behindX = x;
    let behindY = y;
    switch (direction) {
      case Direction.DOWN:
        behindY += 1;
        break;
      case Direction.UP:
        behindY -= 1;
        break;
      case Direction.LEFT:
        behindX -= 1;
        break;
      case Direction.RIGHT:
        behindX += 1;
        break;
    }

    const room = (this.wielder as any)?.getRoom
      ? (this.wielder as any).getRoom()
      : this.game?.rooms?.[this.wielder.levelID];
    if (!room) return false;

    const unpushables = this.getEntitiesAt(behindX, behindY).filter(
      (e) => !e.pushable,
    );
    const hasUnpushablesBehind = unpushables.length > 0;

    const behindTile = room.roomArray[behindX]?.[behindY];
    const isSolidBehind = !behindTile || behindTile.isSolid();

    const pushables = this.getEntitiesAt(x, y).filter((e) => e.pushable);
    const hasSpaceToPush = !isSolidBehind && !hasUnpushablesBehind;

    return pushables.length > 0 && hasSpaceToPush;
  }

  protected attemptKnockback(targetX: number, targetY: number): boolean {
    if (this.knockbackDistance <= 0) return false;

    const room = this.wielder?.getRoom
      ? this.wielder.getRoom()
      : this.game?.rooms?.[this.wielder.levelID];
    if (!room) return false;

    // Find a non-pushable enemy exactly at target tile
    const targets = this.getEntitiesAt(targetX, targetY).filter(
      (e) => !e.pushable && e.isEnemy,
    );
    if (targets.length === 0) return false;

    const enemy = targets[0];
    const dx = Math.sign(targetX - this.wielder.x);
    const dy = Math.sign(targetY - this.wielder.y);

    // Deal damage to first enemy
    this.attack(enemy, this.damage + this.wielder.damageBonus);

    // If enemy is not chainPushable, do not attempt knockback or crush
    if (enemy.chainPushable === false) {
      this.applyHitDelay(true);
      this.hitSound();
      this.wielder.setHitXY(targetX, targetY);
      this.attackAnimation(targetX, targetY);
      if (room) room.tick(this.wielder);
      this.shakeScreen(targetX, targetY);
      this.degrade();
      return true;
    }

    // Compute push chain and attempt to move them one tile
    const { chain, nextX, nextY, enemyEnd } = computePushChain(
      room,
      enemy,
      dx,
      dy,
    );

    const behindTile = room.roomArray?.[nextX]?.[nextY];
    const canMoveOrCrush =
      !!behindTile &&
      (!behindTile.isSolid?.() || behindTile.canCrushEnemy?.() || enemyEnd);

    let moved = false;
    if (canMoveOrCrush) {
      // Push one tile per hit
      moved = applyPushChain(
        room,
        enemy,
        chain,
        dx,
        dy,
        nextX,
        nextY,
        enemyEnd,
      );
    }

    // Apply standard hit side-effects
    this.applyHitDelay(true);
    this.hitSound();
    this.wielder.setHitXY(targetX, targetY);
    this.attackAnimation(targetX, targetY);
    if (room) room.tick(this.wielder);
    this.shakeScreen(targetX, targetY);
    // Only skip enemy's next turn if we actually pushed them
    if (moved) enemy.skipNextTurns = 1;
    this.degrade();

    return true;
  }

  protected applyHitDelay = (hitSomething: boolean) => {
    if (hitSomething) {
      this.wielder.busyAnimating = true;
      setTimeout(() => {
        this.wielder.busyAnimating = false;
      }, this.hitDelay || 0);
    }
  };

  protected executeAttack(
    targetX: number,
    targetY: number,
    animated: boolean = true,
    damage: number = this.damage + this.wielder.damageBonus,
    shakeScreen: boolean = true,
    sound: boolean = true,
    mainAttack: boolean = true,
    shouldTick: boolean = true,
  ): boolean {
    const hitSomething = this.hitEntitiesAt(targetX, targetY, damage);

    this.applyHitDelay(hitSomething);

    if (hitSomething) {
      if (sound) this.hitSound();
      this.wielder.setHitXY(targetX, targetY);
      if (animated) this.attackAnimation(targetX, targetY);
      if (shouldTick) {
        const room = (this.wielder as any)?.getRoom
          ? (this.wielder as any).getRoom()
          : this.game?.rooms?.[this.wielder.levelID];
        if (room) room.tick(this.wielder);
      }
      if (shakeScreen) this.shakeScreen(targetX, targetY);
      if (mainAttack) this.degrade();
    }

    return hitSomething;
  }

  // Begin a new weapon swing; deduplicates hits across multi-tile strikes
  beginSwing = (): void => {
    this._swingHitIds = new Set<string>();
  };

  // End the current swing and clear tracking data
  endSwing = (): void => {
    this._swingHitIds = null;
  };

  // Check and record whether we should apply damage to this entity in the current swing
  protected shouldHitEntity = (entity: Entity): boolean => {
    // If no active swing, allow hit
    if (!this._swingHitIds) return true;

    // Prefer stable unique id if available
    const id: string =
      (entity as any)?.globalId || `${entity.name}:${entity.x},${entity.y}`;
    if (this._swingHitIds.has(id)) return false;
    this._swingHitIds.add(id);
    return true;
  };
}
