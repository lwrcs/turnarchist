import { Room } from "./room";
import { Game } from "./game";
import { Entity, EntityType } from "./entity/entity";
import { Item } from "./item/item";
import { DoorType } from "./tile/door";
import { Tile } from "./tile/tile";

export class Level {
  depth: number;
  environment;
  roomSizeRange: { minDim: number; maxDim: number };
  roomCount: number;

  roomArrays: [Tile[][]];
  entities: Array<Entity>; //array of all entities in level
  items: Array<Item>;
  doors: Array<any>;
  lightLevel: number;
  bossDoorType: DoorType;
  challengeDoors: [{ door: DoorType; count: number }];

  constructor(depth: number) {
    this.depth = depth;
    this.roomCount = this.getRoomCount(this.depth);
    this.roomSizeRange = this.getRoomSizeRange(this.depth);
  }
  getRoomCount = (depth: number) => {
    const baseMin = 5;
    const baseMax = 30;
    const min = baseMin + Math.log2(depth);
    const max = baseMax + Math.log2(depth * 3);
    return (
      Math.floor(Math.random() * (Math.round(max) - Math.round(min) + 1)) +
      Math.round(min)
    );
  };

  getRoomSizeRange = (depth: number) => {
    const baseMin = 3;
    const baseMax = 5;
    const maxDepth = 7;
    const minDim = (baseMin + Math.log2(depth)) * (baseMin + Math.log2(depth));
    const maxDim =
      (baseMax + Math.log2(depth * maxDepth)) *
      (baseMax + Math.log2(depth * maxDepth));
    return { minDim: Math.round(minDim), maxDim: Math.round(maxDim) };
  };
  getLevelEntities = (depth: number) => {};
}
