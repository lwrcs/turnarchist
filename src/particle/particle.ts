import { Drawable } from "../drawable/drawable";
import { Entity } from "../entity/entity";
import { GameConstants } from "../game/gameConstants";
import { Player } from "../player/player";
import { Room } from "../room/room";

export class Particle extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  room: Room;
  drawTopLayer = (delta) => {};
  shadeAmount = () => {
    if (GameConstants.SMOOTH_LIGHTING && !GameConstants.DRAW_SHADE_BELOW_TILES)
      return 0;
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    if (!this.room.softVis[x]) return 0.9;

    const shade = this.room.softVis[x][y];
    return shade ?? 0.9;
  };
  shadeColor = () => {
    return this.room.shadeColor;
  };
}
