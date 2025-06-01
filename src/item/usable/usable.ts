import { Item } from "../item";
import { Player } from "../../player/player";
import { Game } from "../../game";
import { Sound } from "../../sound";
import { Room } from "../../room/room";

export class Usable extends Item {
  user: Player;
  canUseOnOther: boolean;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.canUseOnOther = false;
  }
  onUse = (player: Player) => {};
  useOnOther = (player: Player, other: Item) => {};
}
