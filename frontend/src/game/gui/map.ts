import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Room, RoomType } from "../room/room";
import { Entity, EntityType } from "../entity/entity";
import { Wall } from "../tile/wall";
import { Player } from "../player/player";
import { LevelConstants } from "../level/levelConstants";

export class Map {
  game: Game;
  mapData: any[] = [];
  oldMapData: any[] = [];
  depth: number;
  scale: number;

  offsetX: number = 0;
  offsetY: number = 0;
  softOffsetX: number = 0;
  softOffsetY: number = 0;
  player: Player;

  // Fog of war properties - now stored per mapGroup
  seenTilesByMapGroup: globalThis.Map<string, Set<string>> =
    new globalThis.Map();
  visibilityRadius: number = 4;

  constructor(game: Game, player: Player) {
    this.game = game;
    this.scale = 1;
    this.player = player;
    //this.depth = player.game.level.depth
  }

  // Add helper method to collect down ladders from room array
  getDownLaddersFromRoom = (room: Room): any[] => {
    const downLadders: any[] = [];

    // Safely iterate through the room array to find down ladders
    if (room.roomArray) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          // Check bounds to avoid undefined access
          if (room.roomArray[x] && room.roomArray[x][y]) {
            const tile = room.roomArray[x][y];
            // Check if tile is a DownLadder instance
            if (
              tile &&
              tile.constructor &&
              tile.constructor.name === "DownLadder"
            ) {
              downLadders.push(tile);
            }
          }
        }
      }
    }

    return downLadders;
  };

  saveMapData = () => {
    this.clearMap();
    const currentMapGroup = this.game.room.mapGroup.toString();

    for (const room of this.game.levels[this.player.depth].rooms) {
      if (
        currentMapGroup === room.mapGroup.toString() &&
        (room.entered === true || GameConstants.DEVELOPER_MODE)
      ) {
        this.mapData.push({
          room: room,
          walls: room.innerWalls,
          doors: room.doors,
          entities: room.entities,
          items: room.items,
          players: this.game.players,
          downLadders: this.getDownLaddersFromRoom(room), // Add down ladders to map data
          seenTiles:
            this.seenTilesByMapGroup.get(currentMapGroup) || new Set<string>(), // Add seen tiles to map data
        });
      }
    }

    const enteredRooms = this.mapData
      .map((data) => data.room)
      .filter((room) => room.entered);

    if (enteredRooms.length > 0) {
      const sortedByX = [...enteredRooms].sort((a, b) => a.roomX - b.roomX);
      const sortedByY = [...enteredRooms].sort((a, b) => a.roomY - b.roomY);

      const maxX = sortedByX[sortedByX.length - 1].roomX;
      const minY = sortedByY[0].roomY;

      this.offsetX = maxX;
      this.offsetY = minY;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  };

  clearMap = () => {
    this.mapData = [];
  };

  saveOldMap = () => {
    this.oldMapData = [...this.mapData];
  };

  renderMap = (delta: number) => {
    Game.ctx.save(); // Save the current canvas state

    this.setInitialCanvasSettings(1);
    this.translateCanvas(0);
    for (const data of this.mapData) {
      this.drawRoom(data, delta);
    }
    /*for (const data of this.oldMapData) {
      this.drawRoom(data);
    }*/
    this.resetCanvasTransform();

    Game.ctx.restore(); // Restore the canvas state
  };
  updateOffsetXY = () => {
    let diffX = this.offsetX - this.softOffsetX;
    let diffY = this.offsetY - this.softOffsetY;

    if (Math.abs(diffX) > 0.01) {
      this.softOffsetX += diffX * 0.1;
      this.softOffsetX = this.softOffsetX;
    } else this.softOffsetX = this.offsetX;
    if (Math.abs(diffY) > 0.01) {
      this.softOffsetY += diffY * 0.1;
      this.softOffsetY = this.softOffsetY;
    } else this.softOffsetY = this.offsetY;
  };

  // Fog of war methods
  updateSeenTiles = () => {
    const playerX = Math.floor(this.player.x);
    const playerY = Math.floor(this.player.y);
    const currentMapGroup = this.game.room.mapGroup.toString();

    // Get or create seen tiles set for current map group
    if (!this.seenTilesByMapGroup.has(currentMapGroup)) {
      this.seenTilesByMapGroup.set(currentMapGroup, new Set<string>());
    }
    const seenTiles = this.seenTilesByMapGroup.get(currentMapGroup)!;

    // Add tiles within circular radius around player to seen tiles
    for (let dx = -this.visibilityRadius; dx <= this.visibilityRadius; dx++) {
      for (let dy = -this.visibilityRadius; dy <= this.visibilityRadius; dy++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= this.visibilityRadius) {
          const tileKey = `${playerX + dx},${playerY + dy}`;
          seenTiles.add(tileKey);
        }
      }
    }
  };

  isTileSeen = (x: number, y: number): boolean => {
    const currentMapGroup = this.game.room.mapGroup.toString();
    const seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);
    if (!seenTiles) return false;

    const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
    return seenTiles.has(tileKey);
  };

  draw = (delta: number) => {
    this.updateSeenTiles(); // Update fog of war
    this.updateOffsetXY();
    this.renderMap(delta);
  };

  setInitialCanvasSettings = (alpha: number) => {
    Game.ctx.globalAlpha = alpha;
    Game.ctx.globalCompositeOperation = "source-over";
  };

  translateCanvas = (offset: number) => {
    Game.ctx.translate(
      Math.floor(0.95 * GameConstants.WIDTH) -
        //this.game.room.roomX -
        //Math.floor(0.5 * this.game.room.width) +
        15 * this.scale -
        Math.floor(this.softOffsetX),
      Math.floor(0.05 * GameConstants.HEIGHT) -
        //this.game.room.roomY -
        //Math.floor(0.5 * this.game.room.height) -
        1 * this.scale -
        offset -
        Math.floor(this.softOffsetY),
    );
  };

  drawRoom = (data, delta: number) => {
    //this.drawUnderRoomPlayers(data.players, delta);

    this.drawRoomOutline(data.room);

    this.drawRoomWalls(data.walls);
    this.drawRoomDoors(data.doors);
    this.drawRoomEntities(data.entities);
    this.drawRoomItems(data.items);
    this.drawRoomPlayers(data.players, delta);
    this.drawRoomDownLadders(data.downLadders);

    // Render fog of war on top of everything
    this.drawFogOfWar(data.room);
  };

  // Add fog of war overlay method
  drawFogOfWar = (room) => {
    const s = this.scale;
    Game.ctx.save();
    Game.ctx.fillStyle = "#1a1a1a";

    // Use the seen tiles from the current mapData if available
    const currentMapGroup = this.game.room.mapGroup.toString();
    let seenTiles = this.seenTilesByMapGroup.get(currentMapGroup);

    // If we have mapData, use the seen tiles from there (for consistency)
    if (this.mapData.length > 0 && this.mapData[0].seenTiles) {
      seenTiles = this.mapData[0].seenTiles;
    }

    // Draw fog over all tiles in the room that haven't been seen
    for (let x = room.roomX; x < room.roomX + room.width; x++) {
      for (let y = room.roomY; y < room.roomY + room.height; y++) {
        const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
        if (!seenTiles || !seenTiles.has(tileKey)) {
          Game.ctx.fillRect(x * s, y * s, 1 * s, 1 * s);
        }
      }
    }

    Game.ctx.restore();
  };

  drawRoomOutline = (level) => {
    const s = this.scale;
    Game.ctx.fillStyle = "#5A5A5A";
    Game.ctx.fillRect(
      level.roomX * s + 0,
      level.roomY * s + 0,
      level.width * s - 0,
      level.height * s - 0,
    );
    if (level.type === RoomType.UPLADDER) Game.ctx.fillStyle = "#101460";
    if (level.type === RoomType.DOWNLADDER) Game.ctx.fillStyle = "#601410";
    Game.ctx.fillStyle = "black";
    Game.ctx.fillRect(
      level.roomX * s + 1,
      level.roomY * s + 1,
      level.width * s - 2,
      level.height * s - 2,
    );
  };

  drawRoomWalls = (walls) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const wall of walls) {
      Game.ctx.fillStyle = "#404040";
      Game.ctx.fillRect(wall.x * s, wall.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomDoors = (doors) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const door of doors) {
      if (door.opened === false) Game.ctx.fillStyle = "#5A5A5A";
      if (door.opened === true) {
        Game.ctx.fillStyle = "black";
        Game.ctx.fillRect(door.x * s, door.y * s, 1 * s, 1 * s);
      }
      Game.ctx.fillStyle = "#5A5A5A"; // Reset to default after each door
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomPlayers = (players, delta: number) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const i in players) {
      Game.ctx.fillStyle = "white";
      if (
        this.game.levels[players[i].depth].rooms[players[i].levelID]
          .mapGroup === this.game.room.mapGroup
      ) {
        Game.ctx.fillRect(players[i].x * s, players[i].y * s, 1 * s, 1 * s);
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawUnderRoomPlayers = (players, delta: number) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const i in players) {
      this.game.rooms[players[i].levelID].mapGroup === this.game.room.mapGroup;
      {
        if (Math.floor(Date.now() / 300) % 2) {
          Game.ctx.fillStyle = "#4D8C8C";
          // Draw 3x3 outline box around player
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top left
          Game.ctx.fillRect(
            players[i].x * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top middle
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            (players[i].y - 1) * s,
            1 * s,
            1 * s,
          ); // Top right
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            players[i].y * s,
            1 * s,
            1 * s,
          ); // Middle left
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            players[i].y * s,
            1 * s,
            1 * s,
          ); // Middle right
          Game.ctx.fillRect(
            (players[i].x - 1) * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom left
          Game.ctx.fillRect(
            players[i].x * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom middle
          Game.ctx.fillRect(
            (players[i].x + 1) * s,
            (players[i].y + 1) * s,
            1 * s,
            1 * s,
          ); // Bottom right
        }
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomEntities = (entities) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const enemy of entities) {
      this.setEntityColor(enemy);
      Game.ctx.fillRect(enemy.x * s, enemy.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  drawRoomDownLadders = (downLadders) => {
    const s = this.scale;
    Game.ctx.save(); // Save the current canvas state
    for (const downLadder of downLadders) {
      Game.ctx.fillStyle = "#00FFFF";
      Game.ctx.fillRect(downLadder.x * s, downLadder.y * s, 1 * s, 1 * s);
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  setEntityColor = (enemy) => {
    // No need to save/restore here as only fillStyle is being set
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
    Game.ctx.save(); // Save the current canvas state
    for (const item of items) {
      let x = item.x;
      let y = item.y;
      Game.ctx.fillStyle = "#ac3232";
      if (!item.pickedUp) {
        Game.ctx.fillRect(item.x * s, item.y * s, 1 * s, 1 * s);
      }
    }
    Game.ctx.restore(); // Restore the canvas state
  };

  resetCanvasTransform = () => {
    Game.ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
}
