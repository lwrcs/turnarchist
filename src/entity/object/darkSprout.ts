import { Sprout } from "./sprout";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkSprout extends Sprout {
  static examineText = "A small dark sprout. Barely clinging to life.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark sprout";
    this.tileX = 5;
    this.tileY = 8;
    this.imageParticleX = 9;
  }
}
