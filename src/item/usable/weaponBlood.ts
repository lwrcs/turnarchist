import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Weapon } from "../weapon/weapon";

export class WeaponBlood extends Usable {
  static itemName = "cursed blood";
  static examineText = "A vial of cursed blood. It stains the light.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 12;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.name = WeaponBlood.itemName;
    this.description = "Can be applied to weapons to deal bleed damage";
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon) {
      other.applyStatus({ blood: true, poison: false, curse: false });
      player.inventory.removeItem(this);
      this.level.game.pushMessage(
        `You coat your ${other.name} in cursed blood.`,
      );
    }
  };

  getDescription = () => {
    return "WEAPON BLOOD\nCan be applied to weapons to deal bleed damage";
  };
}
