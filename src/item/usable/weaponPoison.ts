import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Weapon } from "../../weapon/weapon";

export class WeaponPoison extends Usable {
  static itemName = "weapon poison";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 11;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon) {
      other.applyStatus({ poison: true, blood: false });
      player.inventory.removeItem(this);
      this.level.game.pushMessage(
        `You apply the poison to your ${other.name}.`,
      );
      console.log(`weapon poison used on ${other.name}`);
    }
  };

  getDescription = () => {
    return "WEAPON POISON\nCan be applied to weapons to deal poison damage";
  };
}
