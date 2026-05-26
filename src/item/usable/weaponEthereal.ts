import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Weapon } from "../weapon/weapon";

export class WeaponEthereal extends Usable {
  static itemName = "ethereal water";
  static examineText = "Water drawn from a ghost's tears. It seeps through magical barriers.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 16;
    this.tileY = 4;
    this.offsetY = -0.3;
    this.canUseOnOther = true;
    this.name = WeaponEthereal.itemName;
    this.description = "Can be applied to weapons to deal bonus damage against shielded enemies.";
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Weapon && other.canReceiveStatusEffect) {
      other.applyStatus({ poison: false, blood: false, curse: false, ethereal: true });
      player.inventory.removeItem(this);
      this.level.game.pushMessage(`You coat your ${other.name} in ethereal water.`);
    }
  };

  getDescription = () => {
    return "ETHEREAL WATER\nDeals +1 damage against occultist-shielded enemies";
  };
}
