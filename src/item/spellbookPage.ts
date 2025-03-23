import { Item } from "./item";
import { Player } from "../player/player";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";
import { Equippable } from "./equippable";

export class SpellbookPage extends Usable {
  static itemName = "weapon fragments";
  constructor(level: Room, x: number, y: number, stackCount?: number) {
    super(level, x, y);
    this.tileX = 25;
    this.tileY = 2;
    this.offsetY = -0.3;
    this.name = "spellbook pages";
    this.canUseOnOther = true;
    this.stackable = true;
    this.stackCount = stackCount || Math.ceil(Math.random() * 3);
    this.description = "Can be used to restore power to a depleted spellbook";
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    if (this.level.game.rooms[player.levelID] === this.level.game.room)
      Sound.heal();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (
      other instanceof Equippable &&
      other.broken &&
      other.name === "spellbook"
    ) {
      let repairAmount = Math.min(
        other.durabilityMax - other.durability,
        this.stackCount,
      );
      other.durability += repairAmount;
      this.stackCount -= repairAmount;
      other.broken = false;
      this.level.game.pushMessage(
        `You feel your ${other.name}'s power return as you add ${repairAmount} pages to it.`,
      );
      if (this.stackCount <= 0) player.inventory.removeItem(this);
    }
  };
}
