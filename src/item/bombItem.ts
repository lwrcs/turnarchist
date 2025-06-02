import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Sound } from "../sound/sound";
import { Room } from "../room/room";
import { Usable } from "./usable/usable";
//import { Bomb } from "../entity/object/bomb";

export class BombItem extends Usable {
  static itemName = "bomb";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 20;
    this.tileY = 2;
    this.offsetY = -0.3;
    this.name = BombItem.itemName;
    this.description = "explodes";
  }

  onUse = (player: Player) => {
    const { Bomb } = require("../entity/object/bomb");
    Bomb.add(player.game.room, player.game, player.x, player.y);
    player.inventory.removeItem(this);
    Sound.mine();
  };
}
