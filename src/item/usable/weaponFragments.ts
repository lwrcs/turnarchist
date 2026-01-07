import { Item } from "../item";
import { Player } from "../../player/player";
import { Sound } from "../../sound/sound";
import { Room } from "../../room/room";
import { Usable } from "./usable";
import { Equippable } from "../equippable";
import { Random } from "../../utility/random";

export class WeaponFragments extends Usable {
  static itemName = "weapon fragments";
  static examineText = "Weapon scraps. Good for cobbling.";
  constructor(level: Room, x: number, y: number, stackCount?: number) {
    super(level, x, y);
    this.tileX = 3;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = "weapon fragments";
    this.canUseOnOther = true;
    this.stackable = true;
    this.stackCount = stackCount || Math.ceil(Random.rand() * 10) + 7;
    this.description = "Can be used to repair broken weapons";
    this.maximumStackCount = 64;
  }

  onUse = (player: Player) => {
    player.health = Math.min(player.maxHealth, player.health + 1);
    const room = (player as any)?.getRoom
      ? (player as any).getRoom()
      : this.level.game.rooms[player.levelID];
    if (room === this.level.game.room) Sound.heal();
    player.inventory.removeItem(this);

    //this.level.items = this.level.items.filter((x) => x !== this); // removes itself from the level
  };

  useOnOther = (player: Player, other: Item) => {
    if (
      other instanceof Equippable &&
      other.durabilityMax - other.durability >= 1 &&
      other.name !== "spellbook"
    ) {
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
    } else if (other.name === "spellbook") {
      this.level.game.pushMessage(
        "You'll need some book pages to replenish that.",
      );
    }
  };
}
