import { Game } from "./game";
import { GameConstants } from "./gameConstants";
import { Room, RoomType } from "./room";
import { Entity, EntityType } from "./entity/entity";
import { Wall } from "./tile/wall";
import { Player } from "./player";
import { LevelConstants } from "./levelConstants";

export class Map {
  game: Game;
  mapData: any[] = [];
  oldMapData: any[] = [];
  depth: number;
  scale: number;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.scale = 1;
    //this.depth = player.game.level.depth
  }

  saveMapData = () => {
    this.clearMap();
    for (const level of this.game.rooms) {
      if (this.game.room.mapGroup === level.mapGroup) {
        this.mapData.push({
          room: level,
          walls: level.innerWalls,
          doors: level.doors,
          entities: level.entities,
          items: level.items,
          players: this.game.players,
        });
      }
    }
  };

  clearMap = () => {
    this.mapData = [];
  };

  saveOldMap = () => {
    this.oldMapData = [...this.mapData];
  };

  renderMap = (delta: number) => {
    this.setInitialCanvasSettings(1);
    this.translateCanvas(0);
    for (const data of this.mapData) {
      this.drawRoom(data, delta);
    }
    /*for (const data of this.oldMapData) {
      this.drawRoom(data);
    }*/
    this.resetCanvasTransform();
  };

  draw = (delta: number) => {
    this.renderMap(delta);
  };

  setInitialCanvasSettings = (alpha: number) => {
    Game.ctx.globalAlpha = alpha;
    Game.ctx.globalCompositeOperation = "source-over";
  };

  translateCanvas = (offset: number) => {
    Game.ctx.translate(
      0.75 * GameConstants.WIDTH -
        this.game.room.roomX -
        Math.floor(0.5 * this.game.room.width) +
        20 -
        15 * this.scale,
      0.25 * GameConstants.HEIGHT -
        this.game.room.roomY -
        Math.floor(0.5 * this.game.room.height) -
        1 * this.scale -
        offset
    );
  };

  drawRoom = (data, delta: number) => {
    this.drawRoomOutline(data.room);
    this.drawRoomWalls(data.walls);
    this.drawRoomDoors(data.doors);
    this.drawRoomEntities(data.entities);
    this.drawRoomItems(data.items);
    this.drawRoomPlayers(data.players, delta);
  };

  drawRoomOutline = (level) => {
    const s = this.scale;
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
  };

  drawRoomWalls = (walls) => {
    const s = this.scale;
    for (const wall of walls) {
      Game.ctx.fillStyle = "#404040";
      Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
    }
  };

  drawRoomDoors = (doors) => {
    const s = this.scale;
    for (const door of doors) {
      if (door.opened === false) Game.ctx.fillStyle = "#5A5A5A";
      if (door.opened === true)
        (Game.ctx.fillStyle = "black"),
          Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
    }
  };

  drawRoomPlayers = (players, delta: number) => {
    const s = this.scale;
    for (const i in players) {
      Game.ctx.fillStyle = "white";
      if (
        this.game.rooms[players[i].levelID].mapGroup === this.game.room.mapGroup
      ) {
        Game.ctx.fillRect(players[i].x * s, players[i].y * s, 1 * s, 1 * s);
      }
    }
  };

  drawRoomEntities = (entities) => {
    const s = this.scale;
    for (const enemy of entities) {
      this.setEntityColor(enemy);
      Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
    }
  };

  setEntityColor = (enemy) => {
    if (enemy.type === EntityType.ENEMY) {
      Game.ctx.fillStyle = "yellow";
    }
    if (enemy.type === EntityType.PROP) {
      Game.ctx.fillStyle = "#847e87";
    }
    if (enemy.type === EntityType.RESOURCE) {
      Game.ctx.fillStyle = "#5a595b";
    }
    if (enemy.type === EntityType.FRIENDLY) {
      Game.ctx.fillStyle = "cyan";
    }
  };

  drawRoomItems = (items) => {
    const s = this.scale;
    for (const item of items) {
      let x = item.x;
      let y = item.y;
      Game.ctx.fillStyle = "#ac3232";
      if (!item.pickedUp) {
        Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
      }
    }
  };

  resetCanvasTransform = () => {
    Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}
