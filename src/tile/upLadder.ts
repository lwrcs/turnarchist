import { Player } from "../player";
import { Game } from "../game";
import { Room } from "../room";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { DownLadder } from "./downLadder";

export class UpLadder extends Tile {
  linkedLevel: Room;
  game: Game;
  isRope = false;
  depth: number;
  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, x, y);
    this.game = game;
    this.depth = room.depth;
  }

  onCollide = (player: Player) => {
    if (!this.game) {
      console.error("Game instance is undefined in UpLadder:", this);
      return;
    }
    try {
      this.linkLevel();
      this.game.changeLevelThroughLadder(player, this);
    } catch (error) {
      console.error("Error during changeLevelThroughLadder:", error);
    }
  };

  linkLevel = () => {
    this.linkedLevel = this.game.levels[this.depth - 1].exitRoom;
  };

  draw = (delta: number) => {
    let xx = 29;
    let yy = 0;
    if (this.isRope) {
      xx = 16;
      yy = 1;
    }

    Game.drawTile(
      1,
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
    if (!this.isRope)
      Game.drawTile(
        xx,
        yy,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    Game.drawTile(
      xx,
      yy + 1,
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

  drawAbovePlayer = (delta: number) => {
    if (this.isRope)
      Game.drawTile(
        16,
        1,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
  };
}
