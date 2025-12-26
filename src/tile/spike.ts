import { Player } from "../player/player";
import { Game } from "../game";
import { Tile } from "./tile";

export class Spike extends Tile {
  onCollide = (player: Player) => {
    player.hurt(1, "spike", { source: { x: this.x, y: this.y } });
  };

  draw = (delta: number) => {
    Game.drawTile(
      11,
      0,
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
