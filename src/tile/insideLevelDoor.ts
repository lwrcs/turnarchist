import { Player } from "../player/player";
import { Game } from "../game";
import { Room } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";

export class InsideLevelDoor extends Tile {
  game: Game;
  opened: boolean;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, x, y);
    this.game = game;
    this.opened = false;
  }

  isSolid = (): boolean => {
    return !this.opened;
  };
  canCrushEnemy = (): boolean => {
    return !this.opened;
  };
  isOpaque = (): boolean => {
    return !this.opened;
  };

  draw = (delta: number) => {
    Game.drawTile(
      1,
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
    if (this.opened)
      Game.drawTile(
        15,
        1,
        1,
        1,
        this.x,
        this.y,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    else
      Game.drawTile(
        3,
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
  };

  drawAbovePlayer = (delta: number) => {
    if (!this.opened)
      Game.drawTile(
        13,
        0,
        1,
        1,
        this.x,
        this.y - 1,
        1,
        1,
        this.room.shadeColor,
        this.shadeAmount(),
      );
    else
      Game.drawTile(
        14,
        0,
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
