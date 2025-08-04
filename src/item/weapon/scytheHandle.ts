import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Room } from "../../room/room";
import { TextParticle } from "../../particle/textParticle";
import { GameConstants } from "../../game/gameConstants";
import { Usable } from "../usable/usable";
import { Lantern } from "../light/lantern";
import { Light } from "../light/light";
import { Scythe } from "./scythe";
import { ScytheBlade } from "./scytheBlade";

export class ScytheHandle extends Usable {
  static itemName = "scythe handle";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 29;
    this.tileY = 2;
    this.stackable = false;
    this.name = ScytheHandle.itemName;
    this.description = "The handle of a scythe. Find the blade to use it.";
    this.canUseOnOther = true;
  }

  onDrop = () => {
    if (this.level.game.lastDroppedScythePiece === "handle") {
      this.level.game.lastDroppedScythePiece = null;
      this.level.items.push(new ScytheBlade(this.level, this.x, this.y));
      this.level.items = this.level.items.filter((item) => item !== this);
    } else if (this.level.game.lastDroppedScythePiece === null) {
      this.level.game.lastDroppedScythePiece = "handle";
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof ScytheBlade) {
      player.inventory.removeItem(this);
      player.inventory.removeItem(other);
      player.game.pushMessage("You combine the scythe blade and handle.");
      const scythe = new Scythe(
        player.game.rooms[player.levelID],
        player.x,
        player.y,
      );
      player.inventory.addItem(scythe);
    }
  };
}
