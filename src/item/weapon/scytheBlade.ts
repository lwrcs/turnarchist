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
import { ScytheHandle } from "./scytheHandle";

export class ScytheBlade extends Usable {
  static itemName = "scythe blade";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 30;
    this.tileY = 2;
    this.stackable = false;
    this.name = ScytheBlade.itemName;
    this.description = "The blade of a scythe. Find the handle to use it.";
    this.canUseOnOther = true;
  }

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof ScytheHandle) {
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
