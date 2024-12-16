import { SkinType } from "./tile/tile";
export enum EnvType {
  DUNGEON = 0,
  CAVE = 1,
  FOREST = 2,
}
export class Environment {
  type: EnvType;
  skin: SkinType;
  constructor(type: EnvType) {
    this.type = type;
    this.skin = this.type as unknown as SkinType;
  }
}
