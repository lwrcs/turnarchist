import { Succulent } from "./succulent";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkSucculent extends Succulent {
  static examineText = "A dark succulent. Its leaves are deep purple.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark succulent";
    this.tileX = 6;
    this.tileY = 8;
    this.imageParticleX = 9;
  }
}
