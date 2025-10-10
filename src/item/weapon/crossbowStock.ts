import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { Usable } from "../usable/usable";
import { Crossbow } from "./crossbow";
import { CrossbowLimb } from "./crossbowLimb";

export class CrossbowStock extends Usable {
  static itemName = "crossbow stock";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 26;
    this.tileY = 4;
    this.stackable = false;
    this.name = CrossbowStock.itemName;
    this.description = "The stock of a crossbow. Find the limb to use it.";
    this.canUseOnOther = true;
  }

  onDrop = () => {
    if (this.level.game.lastDroppedCrossbowPiece === "stock") {
      this.level.game.lastDroppedCrossbowPiece = null;
      this.level.items.push(new CrossbowLimb(this.level, this.x, this.y));
      this.level.items = this.level.items.filter((item) => item !== this);
    } else if (this.level.game.lastDroppedCrossbowPiece === null) {
      this.level.game.lastDroppedCrossbowPiece = "stock";
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof CrossbowLimb) {
      player.inventory.removeItem(this);
      player.inventory.removeItem(other);
      player.game.pushMessage("You combine the crossbow stock and limb.");
      const room = (player as any)?.getRoom
        ? (player as any).getRoom()
        : player.game.rooms[player.levelID];
      const crossbow = new Crossbow(room, player.x, player.y);
      player.inventory.addItem(crossbow);
    }
  };
}
