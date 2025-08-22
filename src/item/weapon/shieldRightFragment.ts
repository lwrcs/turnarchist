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
import { ShieldLeftFragment } from "./shieldLeftFragment";
import { Armor } from "../armor";

export class ShieldRightFragment extends Usable {
  static itemName = "right shield fragment";
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 2;
    this.tileY = 2;
    this.stackable = false;
    this.name = ShieldRightFragment.itemName;
    this.description =
      "The right fragment of a shield. Find the left fragment to use it.";
    this.canUseOnOther = true;
  }

  onDrop = () => {
    if (this.level.game.lastDroppedShieldPiece === "right") {
      this.level.game.lastDroppedShieldPiece = null;
      this.level.items.push(new ShieldLeftFragment(this.level, this.x, this.y));
      this.level.items = this.level.items.filter((item) => item !== this);
    } else if (this.level.game.lastDroppedShieldPiece === null) {
      this.level.game.lastDroppedShieldPiece = "right";
    }
  };

  useOnOther = (player: Player, other: Item) => {
    if (other instanceof ShieldLeftFragment) {
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
