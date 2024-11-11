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
    return this.room.softVis[Math.floor(this.x)][Math.floor(this.y)];
  };
  shadeColor = () => {
    return this.room.shadeColor;
  };
}
