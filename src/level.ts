import { Room } from "./room";
import { Game } from "./game";
import { Entity, EntityType } from "./entity/entity";
import { Item } from "./item/item";
import { DoorType } from "./tile/door";
import { Tile } from "./tile/tile";

export class Level {
  depth: number;
  levelArray: (Tile | null)[][];
  width: number;
  height: number;
  game: Game;
  rooms: Room[];
  constructor(game: Game, depth: number, width: number, height: number) {
    this.game = game;
    this.depth = depth;
    this.width = width;
    this.height = height;
    this.rooms = game.rooms;
    this.initializeLevelArray();
    this.loadRoomsIntoLevelArray();
  }

  initializeLevelArray = () => {
    // Create a 300x300 grid for depth 0
    this.levelArray = [];
    for (let x = 0; x < this.width; x++) {
      this.levelArray[x] = [];
      for (let y = 0; y < this.height; y++) {
        this.levelArray[x][y] = null;
      }
    }
  };

  loadRoomsIntoLevelArray = () => {
    for (let room of this.rooms) {
      for (let x = room.roomX; x < room.roomX + room.width; x++) {
        for (let y = room.roomY; y < room.roomY + room.height; y++) {
          this.levelArray[x][y] = room.roomArray[x][y];
        }
      }
    }
  };
}
