import { SmallBush } from "./smallBush";
import { Room } from "../../room/room";
import { Game } from "../../game";

export class DarkShrub extends SmallBush {
  static examineText = "A withered dark shrub.";
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, game, x, y);
    this.name = "dark shrub";
    this.tileX = 4;
    this.tileY = 8;
    this.imageParticleX = 9;
  }
}
