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
import { ShieldRightFragment } from "./shieldRightFragment";
import { Armor } from "../armor";

export class ShieldLeftFragment extends Usable {
  static itemName = "left shield fragment";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 2;
    this.stackable = false;
    this.name = ShieldLeftFragment.itemName;
    this.description =
      "The left fragment of a shield. Find the right fragment to use it.";
    this.canUseOnOther = true;
  }

  onDrop = () => {
    if (this.level.game.lastDroppedShieldPiece === "left") {
      this.level.game.lastDroppedShieldPiece = null;
      this.level.items.push(
        new ShieldRightFragment(this.level, this.x, this.y),
      );
      this.level.items = this.level.items.filter((item) => item !== this);
    } else if (this.level.game.lastDroppedShieldPiece === null) {
      this.level.game.lastDroppedScythePiece = "blade";
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof ShieldRightFragment) {
      player.inventory.removeItem(this);
      player.inventory.removeItem(other);
      player.game.pushMessage(
        "You combine the shield fragments into a shield.",
      );
      const room = (player as any)?.getRoom
        ? (player as any).getRoom()
        : player.game.rooms[player.levelID];
      const shield = new Armor(room, player.x, player.y);
      player.inventory.addItem(shield);
    }
  };
}
