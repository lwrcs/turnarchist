import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";

export class Usable extends Item {
  user: Player;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
  }
  onUse = (player: Player) => {};

}
