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

    const hitSomething = this.executeAttack(newX, newY);

    return !hitSomething;
  };

  attack = (enemy: Entity, damage?: number) => {
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

    return room.entities.filter((e) => e.destroyable && e.pointIn(x, y));
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
}
