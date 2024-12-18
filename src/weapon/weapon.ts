import { Room } from "../room";
import { Game } from "../game";
import { Equippable } from "../item/equippable";
import { Sound } from "../sound";
import { SlashParticle } from "../particle/slashParticle";
import type { Entity } from "../entity/entity";
import { GameConstants } from "../gameConstants";
import { WeaponFragments } from "../item/weaponFragments";

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
  statusApplicationCount: number;
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
  }

  break = () => {
    this.durability = 0;
    this.wielder.inventory.weapon = null;
    this.toggleEquip();
    //this.wielder.inventory.removeItem(this);
    //this.wielder = null;
    this.broken = true;
  };

  coEquippable = (other: Equippable): boolean => {
    if (other instanceof Weapon) return false;
    return true;
  };

  applyStatus = (status: WeaponStatus) => {
    this.status = status;
  };

  clearStatus = () => {
    const status = this.status.poison ? "poison" : "bleed";
    this.game.pushMessage(`Your ${this.name}'s ${status} effect dries up`);

    this.status = { poison: false, blood: false };
    this.statusApplicationCount = 0;
  };

  statusEffect = (enemy: Entity) => {
    if (this.wielder.applyStatus(enemy, this.status)) {
      this.statusApplicationCount++;
      const message = this.status.poison
        ? `Your weapon poisons the ${enemy.name}`
        : `Your cursed weapon draws blood from the ${enemy.name}`;
      this.game.pushMessage(message);

      if (this.statusApplicationCount >= 10) this.clearStatus();
    }
  };

  disassemble = () => {
    if (this.equipped) {
      this.game.pushMessage(
        "I should probably unequip this before I try to disassemble it...",
      );
      return;
    }
    let inventory = this.wielder.inventory;
    let inventoryX = this.x;
    let inventoryY = this.y;
    let numFragments = Math.floor(this.durability / 1.5);
    this.toggleEquip();
    inventory.weapon = null;
    inventory.removeItem(this);
    inventory.addItem(
      new WeaponFragments(this.level, inventoryX, inventoryY, numFragments),
    );
  };

  dropFromInventory = () => {
    if (this.wielder.inventory.weapon === this)
      this.wielder.inventory.weapon = null;
    this.wielder = null;
    this.equipped = false;
  };

  weaponMove = (newX: number, newY: number): boolean => {
    let flag = false;
    for (let e of this.game.rooms[this.wielder.levelID].entities) {
      if (e.destroyable && !e.pushable && e.pointIn(newX, newY)) {
        e.hurt(this.wielder, this.damage);
        this.statusEffect(e);

        flag = true;
      }
    }
    if (flag) {
      if (
        this.wielder.game.rooms[this.wielder.levelID] === this.wielder.game.room
      )
        Sound.hit();
      this.wielder.hitX = 0.5 * (this.wielder.x - newX);
      this.wielder.hitY = 0.5 * (this.wielder.y - newY);
      this.game.rooms[this.wielder.levelID].particles.push(
        new SlashParticle(newX, newY),
      );
      this.game.rooms[this.wielder.levelID].tick(this.wielder);
      if (this.wielder === this.game.players[this.game.localPlayerID])
        this.game.shakeScreen(10 * this.wielder.hitX, 10 * this.wielder.hitY);
      this.degrade();
      //console.log(this.durability);
    }
    return !flag;
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

  tick = () => {};

  // returns true if nothing was hit, false if the player should move
}
