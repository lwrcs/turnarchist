import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";
import { Equippable } from "./equippable";

export class WeaponFragments extends Usable {
  static itemName = "weapon fragments";
  constructor(level: Room, x: number, y: number, stackCount?: number) {
    super(level, x, y);
    this.tileX = 3;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = "weapon fragments";
    this.canUseOnOther = true;
    this.stackable = true;
    this.stackCount = stackCount || 10;
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof Equippable && other.broken) {
      let repairAmount = Math.min(
        other.durabilityMax - other.durability,
        this.stackCount,
      );
      other.durability += repairAmount;
      this.stackCount -= repairAmount;
      other.broken = false;
      this.level.game.pushMessage(
        `You repair your ${other.name} with ${repairAmount} fragments.`,
      );
      if (this.stackCount <= 0) player.inventory.removeItem(this);
    }
  };

  getDescription = () => {
    return "WEAPON FRAGMENTS\nCan be used to repair broken weapons";
  };
}
