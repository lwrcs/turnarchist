import { Barrel } from "../entity/object/barrel";
import { Block } from "../entity/object/block";
import { Bush } from "../entity/object/bush";
import { Chest } from "../entity/object/chest";
import { Crate } from "../entity/object/crate";
import { Mushrooms } from "../entity/object/mushrooms";
import { Pot } from "../entity/object/pot";
import { PottedPlant } from "../entity/object/pottedPlant";
import { Pumpkin } from "../entity/object/pumpkin";
import { Sprout } from "../entity/object/sprout";
import { TombStone } from "../entity/object/tombStone";
import { Rock } from "../entity/resource/rockResource";
import { SkinType } from "../tile/tile";
import { RoomType } from "../room/room";
import { CoalResource } from "../entity/resource/coalResource";
import { GoldResource } from "../entity/resource/goldResource";
import { EmeraldResource } from "../entity/resource/emeraldResource";

export enum EnvType {
  DUNGEON = 0,
  CAVE = 1,
  FOREST = 2,
  SWAMP = 3,
  GLACIER = 4,
  CASTLE = 5,
}

export class Environment {
  type: EnvType;
  skin: SkinType;
  constructor(type: EnvType) {
    this.type = type;
    this.skin = this.type as unknown as SkinType;
  }
}

interface PropInfo {
  class: any; // The class constructor
  weight?: number; // Spawn weight
  blacklistedEnvironments?: EnvType[]; // Environments where this prop shouldn't spawn
  additionalParams?: any[]; // Extra constructor parameters if needed
}

interface EnvironmentPropData {
  props: PropInfo[]; // Single category for all props
}

const props: PropInfo[] = [
  { class: Crate },
  { class: Barrel },
  { class: TombStone, additionalParams: [1] },
  { class: TombStone, additionalParams: [0] },
  { class: Pumpkin },
  { class: Block },
  { class: Pot },
  { class: PottedPlant },
  { class: Bush },
  { class: Sprout },
  { class: Mushrooms },
  { class: Rock },
  { class: Chest },
];

const environmentProps: Record<EnvType, EnvironmentPropData> = {
  [EnvType.DUNGEON]: {
    props: [
      { class: Crate, weight: 1 },
      { class: Barrel, weight: 1 },
      { class: TombStone, weight: 0.1, additionalParams: [1] },
      { class: TombStone, weight: 0.1, additionalParams: [0] },
      { class: Pumpkin, weight: 0.25 },
      { class: Block, weight: 1 },
      { class: Pot, weight: 0.45 },
      { class: PottedPlant, weight: 0.2 },
      { class: Rock, weight: 0.1 },
      { class: Mushrooms, weight: 0.25 },
      { class: Bush, weight: 0.1 },
      { class: Sprout, weight: 0.025 },
      { class: Chest, weight: 0.025 },
    ],
  },
  [EnvType.CAVE]: {
    props: [
      { class: CoalResource, weight: 1 },
      { class: GoldResource, weight: 0.1 },
      { class: EmeraldResource, weight: 0.05 },
      { class: Block, weight: 0.2 },
      { class: Rock, weight: 0.4 },
      { class: Mushrooms, weight: 0.3 },
      { class: Pot, weight: 0.2 },
      { class: Chest, weight: 0.1 },
    ],
  },
  [EnvType.FOREST]: {
    props: [
      { class: TombStone, weight: 0.1, additionalParams: [1] },
      { class: TombStone, weight: 0.1, additionalParams: [0] },
      { class: Pumpkin, weight: 0.25 },
      { class: Block, weight: 0.1 },
      { class: Bush, weight: 1 },
      { class: Sprout, weight: 0.25 },
      { class: Mushrooms, weight: 0.2 },
      { class: Rock, weight: 0.1 },
      { class: Chest, weight: 0.05 },
    ],
  },
  [EnvType.SWAMP]: {
    props: [
      { class: Barrel, weight: 8 },
      { class: TombStone, weight: 5, additionalParams: [1] },
      { class: TombStone, weight: 2, additionalParams: [0] },
      { class: Block, weight: 5 },
      { class: Mushrooms, weight: 0.5 },
      { class: Bush, weight: 0.25 },
      { class: Pot, weight: 0.15 },
      { class: Rock, weight: 0.05 },
      { class: Chest, weight: 0.05 },
    ],
  },
  [EnvType.GLACIER]: {
    props: [
      { class: Block, weight: 20 },
      { class: Crate, weight: 5 },
      { class: Rock, weight: 0.6 },
      { class: Chest, weight: 0.4 },
    ],
  },
  [EnvType.CASTLE]: {
    props: [
      { class: Crate, weight: 10 },
      { class: Barrel, weight: 8 },
      { class: TombStone, weight: 4, additionalParams: [1] },
      { class: TombStone, weight: 2, additionalParams: [0] },
      { class: Block, weight: 6 },
      { class: PottedPlant, weight: 0.4 },
      { class: Pot, weight: 0.3 },
      { class: Chest, weight: 0.2 },
      { class: Rock, weight: 0.1 },
    ],
  },
};

export { environmentProps, PropInfo, EnvironmentPropData };
