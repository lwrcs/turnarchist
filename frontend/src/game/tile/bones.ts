import { Game } from "../game";
import { Floor } from "./floor";

export class Bones extends Floor {
  draw = (delta: number) => {
    Game.drawTile(
      7,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };
}
