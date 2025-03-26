import { Drawable } from "../drawable";
import { Entity } from "../entity/entity";
import { Player } from "../player/player";
import { Room } from "../room/room";

export class Particle extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  room: Room;
  drawTopLayer = (delta) => {};
  shadeAmount = () => {
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
