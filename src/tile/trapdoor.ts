import { Game } from "../game";
import { Room } from "../room";
import { Player } from "../player";
import { LevelConstants } from "../levelConstants";
import { Tile } from "./tile";

export class Trapdoor extends Tile {
  game: Game;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, x, y);
    this.game = game;
  }

  draw = (delta: number) => {
    Game.drawTile(
      13,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount()
    );
  };

  onCollide = (player: Player) => {
    // TODO
  };
}
