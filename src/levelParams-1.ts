import { Enemy, EntityType } from "./enemy/enemy";
import { Item } from "./item/item";
import { DoorType } from "./tile/door";

export class LevelParams {
  depth: number;
  environment;

  roomSizeRange: { minX: number; maxX: number; minY: number; maxY: number };
  floorSizeRange: { minX: number; maxX: number; minY: number; maxY: number };
  loopCountRange: { min: number; max: number };
  roomCountRange: { min: number; max: number };
  entities: [
    {
      entity: Enemy;
      type: EntityType;
      spawnProb: number;
      bossProb: number;
      drop: Item;
      itemProb: number;
    }
  ];
  lightLevel: number;
  bossDoorType: DoorType;
  challengeDoors: [{door: DoorType, count: number}]

}
