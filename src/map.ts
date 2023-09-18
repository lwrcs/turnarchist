import { Game } from "./game";
import { GameConstants } from "./gameConstants";
import { RoomType } from "./level";
import { EntityType } from "./gameState";
import { Wall } from "./tile/wall";

export class Map {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw = (delta: number) => {
    const s = 2;
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0;
    Game.ctx.fillStyle = "white";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    Game.ctx.translate(
      0.75 * GameConstants.WIDTH -
        this.game.level.roomX -
        Math.floor(0.5 * this.game.level.width) + 20,
      0.25 * GameConstants.HEIGHT -
        this.game.level.roomY -
        Math.floor(0.5 * this.game.level.height)
    );

    Game.ctx.globalAlpha = 1;
    for (const level of this.game.levels) {
      if (this.game.level.mapGroup === level.mapGroup && level.entered) {
        Game.ctx.fillStyle = "#5A5A5A";
        Game.ctx.fillRect(
          level.roomX * s + 0,
          level.roomY * s + 0,
          level.width * s - 0,
          level.height * s - 0
        );
        if (level.type === RoomType.UPLADDER) Game.ctx.fillStyle = "#101460";
        if (level.type === RoomType.DOWNLADDER) Game.ctx.fillStyle = "#601410";
        Game.ctx.fillStyle = "black";
        Game.ctx.fillRect(
          level.roomX * s + 1,
          level.roomY * s + 1,
          level.width * s - 2,
          level.height * s - 2
        );
        for (const wall of level.walls) {
          Game.ctx.fillStyle = "#404040";
          Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
        }
        for (const door of level.doors) {
          if (door.opened === false) Game.ctx.fillStyle = "#5A5A5A";
          if (door.opened === true)
            (Game.ctx.fillStyle = "black"),
              Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
        }
        for (const enemy of level.enemies) {
          Game.ctx.fillStyle = "yellow";
          Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s)
        }
      }
    }
      for (const i in this.game.players) {
        Game.ctx.fillStyle = GameConstants.RED;
        if (
          this.game.levels[this.game.players[i].levelID].mapGroup ===
          this.game.level.mapGroup
        ) {
          Game.ctx.fillRect(
            this.game.players[i].x * s,
            this.game.players[i].y * s,
            1 * s,
            1 * s
          );
        }
      }
      Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
  };
}
