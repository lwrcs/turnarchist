import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Pickup } from "./pickup";

export class Potion extends Pickup {
  constructor(x: number, y: number) {
    super(x, y);

    this.tileX = 2;
    this.tileY = 0;
  }

  onPickup = (player: Player) => {
    player.heal(Game.randTable([9, 10, 10, 10, 10, 15]));
  };
}
