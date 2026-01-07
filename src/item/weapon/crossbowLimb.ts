import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { Usable } from "../usable/usable";
import { CrossbowStock } from "./crossbowStock";
import { Crossbow } from "./crossbow";

export class CrossbowLimb extends Usable {
  static itemName = "crossbow limb";
  static examineText = "A crossbow limb. Springy and sharp.";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 27;
    this.tileY = 4;
    this.stackable = false;
    this.name = CrossbowLimb.itemName;
    this.description = "The limb of a crossbow. Find the stock to use it.";
    this.canUseOnOther = true;
  }

  onDrop = () => {
    if (this.level.game.lastDroppedCrossbowPiece === "limb") {
      this.level.game.lastDroppedCrossbowPiece = null;
      this.level.items.push(new CrossbowStock(this.level, this.x, this.y));
      this.level.items = this.level.items.filter((item) => item !== this);
    } else if (this.level.game.lastDroppedCrossbowPiece === null) {
      this.level.game.lastDroppedCrossbowPiece = "limb";
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof CrossbowStock) {
      player.inventory.removeItem(this);
      player.inventory.removeItem(other);
      player.game.pushMessage("You combine the crossbow limb and stock.");
      const room = (player as any)?.getRoom
        ? (player as any).getRoom()
        : player.game.rooms[player.levelID];
      const crossbow = new Crossbow(room, player.x, player.y);
      player.inventory.addItem(crossbow);
    }
  };
}
