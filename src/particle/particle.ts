import { Drawable } from "../drawable";
import { Entity } from "../entity/entity";
import { Player } from "../player";
import { Room } from "../room";

export class Particle extends Drawable {
  x: number;
  y: number;
  dead: boolean;
  room: Room;
  drawTopLayer = (delta) => {};
  shadeAmount = () => {
    let shade = this.room.softVis[Math.floor(this.x)][Math.floor(this.y)];
    if (shade !== undefined) return shade;
    else return 1;
  };
  shadeColor = () => {
    return this.room.shadeColor;
  };
}
