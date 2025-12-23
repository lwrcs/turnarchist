import { Room } from "../room/room";
import { Tile } from "./tile";

/**
 * "Air" is an invisible solid tile used for z-layer boundaries (debug + future geometry).
 * It blocks movement but draws nothing.
 */
export class Air extends Tile {
  constructor(room: Room, x: number, y: number) {
    super(room, x, y);
    this.name = "air";
  }

  isSolid = (): boolean => true;

  draw = (delta: number) => {
    // Intentionally blank (invisible).
  };
}
