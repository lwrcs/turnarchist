import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Equippable } from "../equippable";
import { GameplaySettings } from "../../game/gameplaySettings";

export class GarnetRing extends Equippable {
  static itemName = "garnet ring";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 12;
    this.tileY = 2;
    this.name = GarnetRing.itemName;
    this.stackable = false;
    this.description = "A ring of garnet";
  }

  onEquip = () => {
    if (!this.wielder) return;
    this.wielder.damageBonus = 1;
    this.wielder.maxHealth = 1;
    if (this.wielder.health > 1) {
      // "Hurt by the difference" (do not apply armor mitigation; this is a direct effect).
      this.wielder.health = 1;
      this.wielder.healthBar?.hurt?.();
    }
    this.level.game.pushMessage("You feel a surge of power in your ring.");
  };

  onUnequip = () => {
    if (!this.wielder) return;
    this.wielder.damageBonus = 0;
    this.wielder.maxHealth = GameplaySettings.STARTING_HEALTH;
    if (this.wielder.health > this.wielder.maxHealth) {
      this.wielder.health = this.wielder.maxHealth;
    }
    this.level.game.pushMessage("The power in your ring fades.");
  };

  onDrop = () => {
    if (this.wielder) {
      this.wielder.damageBonus = 0;
      if (this.equipped) {
        this.wielder.maxHealth = GameplaySettings.STARTING_HEALTH;
        if (this.wielder.health > this.wielder.maxHealth) {
          this.wielder.health = this.wielder.maxHealth;
        }
      }
    }
    if (this.equipped) {
      this.level.game.pushMessage("The power in your ring fades.");
      this.equipped = false;
    }
  };
}
