import { Game } from "./game";
import { GameConstants } from "./gameConstants";
import { RoomType } from "./room";
import { EntityType } from "./enemy/enemy";
import { Wall } from "./tile/wall";

export class Map {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  draw = (delta: number) => {
    const s = 2;
    if (GameConstants.ALPHA_ENABLED) Game.ctx.globalAlpha = .2;
    Game.ctx.fillStyle = "#006A6E";
    const x = Game.ctx.globalCompositeOperation
    Game.ctx.globalCompositeOperation = "screen"
    Game.ctx.fillRect(0, 0, GameConstants.WIDTH, GameConstants.HEIGHT);
    Game.ctx.globalCompositeOperation = x

    Game.ctx.translate(
      0.75 * GameConstants.WIDTH -
        this.game.level.roomX -
        Math.floor(0.5 * this.game.level.width) +
        20,
      0.25 * GameConstants.HEIGHT -
        this.game.level.roomY -
        Math.floor(0.5 * this.game.level.height)
    );

    Game.ctx.globalAlpha = 1;
    for (const level of this.game.rooms) {
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
          if (enemy.entityType === EntityType.Enemy) {
            Game.ctx.fillStyle = "yellow";
          }
          if (enemy.entityType === EntityType.Prop) {
            Game.ctx.fillStyle = "#847e87";
          }
          if (enemy.entityType === EntityType.Resource) {
            Game.ctx.fillStyle = "#5a595b";
          }
          if (enemy.entityType === EntityType.Friendly) {
            Game.ctx.fillStyle = "cyan";
          }

          Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
        }
        for (const item of level.items) {
          let x = item.x;
          let y = item.y;
          Game.ctx.fillStyle = "#ac3232";
          if (!item.pickedUp) {
            Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
          }
        }
      }
    }
    for (const i in this.game.players) {
      Game.ctx.fillStyle = "white";
      if (
        this.game.rooms[this.game.players[i].levelID].mapGroup ===
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

