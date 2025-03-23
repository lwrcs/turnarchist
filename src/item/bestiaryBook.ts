import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Sound } from "../sound";
import { Room } from "../room";
import { Usable } from "./usable";
import { Bestiary } from "../bestiary";

export class BestiaryBook extends Usable {
  static itemName = "bestiary book";

  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.tileX = 8;
    this.tileY = 0;
    this.offsetY = -0.3;
    this.name = BestiaryBook.itemName;
    this.description = "opens the bestiary";
  }

  onUse = (player: Player) => {
    if (player.bestiary === null) {
      player.bestiary = new Bestiary(player.game, player);
    }
    player.bestiary.toggleOpen();
  };
}
