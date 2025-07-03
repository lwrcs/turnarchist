import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { DownLadder } from "./downLadder";

export class UpLadder extends Tile {
  linkedRoom: Room;
  game: Game;
  isRope = false;
  depth: number;
  frame: number = 0;
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
      if (!this.linkedRoom) {
        this.linkRoom();
      }
      this.game.changeLevelThroughLadder(player, this);
    } catch (error) {
      console.error("Error during changeLevelThroughLadder:", error);
    }
  };

  getName = () => {
    return this.isRope ? "rope up" : "staircase up";
  };

  linkRoom = () => {
    this.linkedRoom = this.game.levels[this.depth - 1].exitRoom;
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

  drawAboveShading = (delta: number) => {
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
    let multiplier = 0.125;

    Game.drawFX(
      2,
      2,
      1,
      1,
      this.x,
      this.y - 1.25 + multiplier * Math.sin((this.frame * Math.PI) / 50),
      1,
      1,
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
