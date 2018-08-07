import { Game } from "../game";
import { Tile } from "./tile";

export class WallSide extends Tile {
  isSolid = (): boolean => {
    return true;
  };
  isOpaque = (): boolean => {
    return true;
  };

  draw = () => {
    Game.drawTile(0, this.skin, 1, 1, this.x, this.y, 1, 1, this.isShaded());
  };
}
