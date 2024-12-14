import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";
import { Weapon } from "../weapon/weapon";
import { Dagger } from "../weapon/dagger";

export class Hammer extends Usable {
  static itemName = "hammer";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 8;
    this.tileY = 2;
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
    if (other instanceof Weapon && other.name !== "dagger") {
      other.disassemble();
      this.level.game.pushMessage(
        `You dissassemble your ${other.name} into fragments.`,
      );
    } else if (other.name === "dagger") {
      this.level.game.pushMessage(
        `You probably shouldn't disassemble your dagger...`,
      );
    }
  };
}
