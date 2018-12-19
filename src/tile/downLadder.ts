import { Player } from "../player";
import { Game } from "../game";
import { Level } from "../level";
import { BottomDoor } from "./bottomDoor";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { UpLadder } from "./upLadder";

export class DownLadder extends Tile {
  linkedLadder: UpLadder;
  game: Game;

  constructor(level: Level, game: Game, x: number, y: number) {
    super(level, x, y);
    this.game = game;
    this.linkedLadder = null;
  }

  onCollide = (player: Player) => {
    if (!this.linkedLadder) {
      this.linkedLadder = this.game.levelgen.generate(this.game, this.level.depth + 1);
      this.linkedLadder.linkedLadder = this;
    }
    this.game.changeLevelThroughLadder(this.linkedLadder);
  };

  draw = () => {
    Game.drawTile(4, this.skin, 1, 1, this.x, this.y, 1, 1, this.isShaded());
  };

  drawAbovePlayer = () => {};
}
