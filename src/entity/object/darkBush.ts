import { Bush } from "./bush";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkBush extends Bush {
  static examineText = "A thorny dark bush. Something moves inside it.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark bush";
    this.tileX = 7;
    this.tileY = 8;
    this.imageParticleX = 9;
  }
}
