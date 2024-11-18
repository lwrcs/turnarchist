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
    this.width = width + 100; // 100 to keep values positive
    this.height = height + 100;
    this.rooms = game.rooms;
  }

  initializeLevelMap = () => {
    // Create a 300x300 grid for depth 0
    this.levelArray = [];
    for (let x = 0; x < this.width; x++) {
      this.levelArray[x] = [];
    }
  };
}
