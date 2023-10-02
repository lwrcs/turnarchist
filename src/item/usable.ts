import { Item } from "./item";
import { Player } from "../player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Level } from "../level";

export class Usable extends Item {
  user: Player;
  constructor(level: Level, x: number, y: number) {
    super(level, x, y);
  }
  onUse = (player: Player) => {};

}
