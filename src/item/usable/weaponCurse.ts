import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Weapon } from "../weapon/weapon";

export class WeaponCurse extends Usable {
  static itemName = "weapon curse";
  static examineText = "A vial of cursed ectoplasm. It stains the light.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 15;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.name = WeaponCurse.itemName;
    this.description = "Can be applied to weapons.";
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon) {
      other.applyStatus({ poison: false, blood: false, curse: true });
      player.inventory.removeItem(this);
      this.level.game.pushMessage(`You apply the curse to your ${other.name}.`);
      console.log(`weapon curse used on ${other.name}`);
    }
  };

  getDescription = () => {
    return "WEAPON CURSE\nCan be applied to weapons to deal curse damage";
  };
}
