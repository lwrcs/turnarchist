import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Weapon } from "../weapon/weapon";

export class WeaponPlague extends Usable {
  static itemName = "weapon plague";
  static examineText = "A vial of plague spores. They fester in wounds.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 16;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.name = WeaponPlague.itemName;
    this.description = "Can be applied to weapons to inflict plague on enemies.";
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon) {
      other.applyStatus({ poison: false, blood: false, curse: false, ethereal: false, plague: true });
      player.inventory.removeItem(this);
      this.level.game.pushMessage(`You apply the plague to your ${other.name}.`);
    }
  };

  getDescription = () => {
    return "WEAPON PLAGUE\nSpreads plague on hit";
  };
}
