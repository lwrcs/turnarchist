import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";

export class Door extends Tile {
  linkedDoor: BottomDoor;
  game: Game;
  opened: boolean;

  constructor(level: Level, game: Game, x: number, y: number, linkedDoor: BottomDoor) {
    super(level, x, y);
    this.game = game;
    this.linkedDoor = linkedDoor;
    this.opened = false;
  }

  onCollide = (player: Player) => {
    this.opened = true;
    this.game.changeLevelThroughDoor(this.linkedDoor);
  };

  draw = () => {
    if (this.opened) Game.drawTile(6, this.skin, 1, 1, this.x, this.y, 1, 1, this.isShaded());
    else Game.drawTile(3, this.skin, 1, 1, this.x, this.y, 1, 1, this.isShaded());
  };

  drawAbovePlayer = () => {
    if (!this.opened) Game.drawTile(13, 0, 1, 1, this.x, this.y - 1, 1, 1, this.isShaded());
    else Game.drawTile(14, 0, 1, 1, this.x, this.y - 1, 1, 1, this.isShaded());
  };
}
