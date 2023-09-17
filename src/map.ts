import { Game } from "./game";
import { GameConstants } from "./gameConstants";
import { RoomType } from "./level";
import { EntityType } from "./gameState";

export class Map {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw = (delta: number) => {
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = 0;
    Game.ctx.fillStyle = "white";
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);

    Game.ctx.translate(
      0.25 * GameConstants.WIDTH -
        this.game.level.roomX -
        Math.floor(0.5 * this.game.level.width),
      0.25 * GameConstants.HEIGHT -
        this.game.level.roomY -
        Math.floor(0.5 * this.game.level.height)
    );

    Game.ctx.globalAlpha = 1;
    for (const level of this.game.levels) {
      if (this.game.level.mapGroup === level.mapGroup && level.entered) {
        Game.ctx.fillStyle = "black";

        Game.ctx.fillRect(
          level.roomX + 0,
          level.roomY + 0,
          level.width - 0,
          level.height - 0
        );
        Game.ctx.fillStyle = "#5A5A5A";
        if (level.type === RoomType.UPLADDER) Game.ctx.fillStyle = "#101460";
        if (level.type === RoomType.DOWNLADDER) Game.ctx.fillStyle = "#601410";
        Game.ctx.fillRect(
          level.roomX + 1,
          level.roomY + 1,
          level.width - 2,
          level.height - 2
        );

        for (const door of level.doors) {
          if (door.opened === false) Game.ctx.fillStyle = "black";
          Game.ctx.fillRect(door.x, door.y, 1, 1);
          if (door.opened === true) Game.ctx.fillStyle = "5A5A5A";
          Game.ctx.fillRect(door.x, door.y, 1, 1);
        }
        for (const enemy of level.enemies) {
          /*switch (enemy.entityType) {
            case EntityType.Enemy:
              Game.ctx.fillStyle = "yellow";
              break;
            case EntityType.Object:
              Game.ctx.fillStyle = "orange";
              break;
            case EntityType.Special:
              Game.ctx.fillStyle = "red";
              break;
          }*/
          Game.ctx.fillStyle = "yellow";
          Game.ctx.fillRect(enemy.x, enemy.y, 1, 1);
        }
      }
    }
    Game.ctx.fillStyle = GameConstants.RED;
    for (const i in this.game.players) {
      if (
        this.game.levels[this.game.players[i].levelID].mapGroup ===
        this.game.level.mapGroup
      ) {
        Game.ctx.fillRect(this.game.players[i].x, this.game.players[i].y, 1, 1);
      }
    }
    Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}
