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
import { GlowBugEnemy } from "../entity/enemy/glowBugEnemy";
import { Tree } from "../entity/object/tree";
import { EnvType } from "../constants/environmentTypes";
import { DownladderMaker } from "../entity/downladderMaker";
import { DecoBlock } from "../entity/object/decoBlock";
import { Furnace } from "../entity/object/furnace";

// Enemy imports
import { CrabEnemy } from "../entity/enemy/crabEnemy";
import { FrogEnemy } from "../entity/enemy/frogEnemy";
import { ZombieEnemy } from "../entity/enemy/zombieEnemy";
import { SkullEnemy } from "../entity/enemy/skullEnemy";
import { EnergyWizardEnemy } from "../entity/enemy/energyWizard";
import { ChargeEnemy } from "../entity/enemy/chargeEnemy";
import { RookEnemy } from "../entity/enemy/rookEnemy";
import { BishopEnemy } from "../entity/enemy/bishopEnemy";
import { ArmoredzombieEnemy } from "../entity/enemy/armoredzombieEnemy";
import { BigSkullEnemy } from "../entity/enemy/bigSkullEnemy";
import { QueenEnemy } from "../entity/enemy/queenEnemy";
import { KnightEnemy } from "../entity/enemy/knightEnemy";
import { BigKnightEnemy } from "../entity/enemy/bigKnightEnemy";
import { ArmoredSkullEnemy } from "../entity/enemy/armoredSkullEnemy";
import { FireWizardEnemy } from "../entity/enemy/fireWizard";
import { MummyEnemy } from "../entity/enemy/mummyEnemy";
import { SpiderEnemy } from "../entity/enemy/spiderEnemy";
import { ObsidianResource } from "../entity/resource/obsidianResource";
import { PawnEnemy } from "../entity/enemy/pawnEnemy";
import { BigFrogEnemy } from "../entity/enemy/bigFrogEnemy";
import { BeetleEnemy } from "../entity/enemy/beetleEnemy";
import { GarnetResource } from "../entity/resource/garnetResource";
import { ZirconResource } from "../entity/resource/zirconResource";
import { AmberResource } from "../entity/resource/amberResource";
import { Candelabra } from "../entity/object/candelabra";
import { KingEnemy } from "../entity/enemy/kingEnemy";
import { BishopStatue } from "../entity/object/bishopStatue";
import { RookStatue } from "../entity/object/rookStatue";
import { PawnStatue } from "../entity/object/pawnStatue";
import { FallenPillar } from "../entity/object/fallenPillar";
import { Succulent } from "../entity/object/succulent";
import { SmallBush } from "../entity/object/smallBush";
import { ObsidianBlock } from "../entity/object/obsidianBlock";
import { DarkPillar } from "../entity/object/darkPillar";
import { DarkCrate } from "../entity/object/darkCrate";
import { DarkPot } from "../entity/object/darkPot";
import { DarkVase } from "../entity/object/darkVase";
import { BoltcasterEnemy } from "../entity/enemy/boltcasterEnemy";
import { Enemy } from "../entity/enemy/enemy";
import { CaveRock } from "../entity/resource/caveRockResource";
import { CaveBlock } from "../entity/object/caveBlock";
import { EarthWizardEnemy } from "../entity/enemy/earthWizard";

// Enemy ID mapping for integration with level progression system
export const enemyClassToId: Map<typeof Enemy, number> = new Map<
  typeof Enemy,
  number
>([
  [CrabEnemy, 1],
  [FrogEnemy, 2],
  [ZombieEnemy, 3],
  [SkullEnemy, 4],
  [EnergyWizardEnemy, 5],
  [ChargeEnemy, 6],
  [RookEnemy, 7],
  [BishopEnemy, 8],
  [ArmoredzombieEnemy, 9],
  [BigSkullEnemy, 10],
  [QueenEnemy, 11],
  [KnightEnemy, 12],
  [BigKnightEnemy, 13],
  [FireWizardEnemy, 14],
  [ArmoredSkullEnemy, 15],
  [MummyEnemy, 16],
  [SpiderEnemy, 17],
  [PawnEnemy, 18],
  [BigFrogEnemy, 19],
  [BeetleEnemy, 20],
  [KingEnemy, 21],
  [BoltcasterEnemy, 22],
  [EarthWizardEnemy, 23],
]);

export class Environment {
  type: EnvType;
  skin: SkinType;
  constructor(type: EnvType) {
    this.type = type;
    this.skin = this.type as unknown as SkinType;
    if (this.type === EnvType.TUTORIAL) {
      this.skin = SkinType.DUNGEON as SkinType;
    }
  }
}

// Import the enemy minimum depth from level.ts
//export { enemyMinimumDepth } from "./level";

interface PropInfo {
  class: any; // The class constructor
  weight?: number; // Spawn weight
  blacklistedEnvironments?: EnvType[]; // Environments where this prop shouldn't spawn
  additionalParams?: any[]; // Extra constructor parameters if needed
  size?: { w: number; h: number }; // Optional footprint size in tiles
}

interface EnemyInfo {
  class: any;
  weight?: number;
  minDepth?: number;
  blacklistedEnvironments?: EnvType[];
  additionalParams?: any[];
  specialSpawnLogic?: "clearFloor" | "bigEnemy";
  size?: { w: number; h: number };
}

interface EnvironmentData {
  props: PropInfo[];
  enemies: EnemyInfo[];
}

// A do-nothing prop used to control spawn density without placing anything
export class NullProp {
  static add(): void {
    // intentionally empty
  }
}

const environmentData: Record<EnvType, EnvironmentData> = {
  [EnvType.DUNGEON]: {
    props: [
      { class: Crate, weight: 1 },
      { class: Barrel, weight: 1 },
      { class: TombStone, weight: 0.01, additionalParams: [1] },
      { class: TombStone, weight: 0.01, additionalParams: [0] },
      { class: Pumpkin, weight: 0.05 },
      { class: Block, weight: 1 },
      { class: Pot, weight: 1 },
      { class: PottedPlant, weight: 1 },
      { class: Mushrooms, weight: 0.1 },
      { class: Bush, weight: 0.1 },
      { class: Sprout, weight: 0.025 },
      { class: Chest, weight: 0.025 },
      { class: DecoBlock, weight: 0.05 },
      { class: Furnace, weight: 0.05 },
    ],
    enemies: [
      // Early game enemies (depth 0+)
      { class: CrabEnemy, weight: 1.0, minDepth: 0 },
      { class: ZombieEnemy, weight: 1.2, minDepth: 0 },
      { class: SkullEnemy, weight: 1.0, minDepth: 0 },
      { class: SpiderEnemy, weight: 1.0, minDepth: 2 },
      { class: MummyEnemy, weight: 1.0, minDepth: 2 },
      { class: PawnEnemy, weight: 1.0, minDepth: 1 },
      { class: KingEnemy, weight: 0.1, minDepth: 2 },
      { class: BoltcasterEnemy, weight: 0.25, minDepth: 4 },

      // Mid game enemies (depth 1+)
      { class: EnergyWizardEnemy, weight: 0.1, minDepth: 1 },
      { class: RookEnemy, weight: 0.6, minDepth: 1 },
      { class: BishopEnemy, weight: 0.6, minDepth: 1 },
      { class: ArmoredzombieEnemy, weight: 0.8, minDepth: 1 },
      { class: KnightEnemy, weight: 0.7, minDepth: 1 },

      // Late game enemies (depth 2+)
      { class: ChargeEnemy, weight: 0.5, minDepth: 2 },
      {
        class: BigSkullEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: QueenEnemy, weight: 0.2, minDepth: 2 },
      {
        class: BigKnightEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: FireWizardEnemy, weight: 0.1, minDepth: 2 },
      { class: EarthWizardEnemy, weight: 0.1, minDepth: 2 },
      { class: ArmoredSkullEnemy, weight: 0.5, minDepth: 2 },
      {
        class: BigFrogEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
    ],
  },
  [EnvType.CAVE]: {
    props: [
      { class: NullProp, weight: 1 },
      { class: CoalResource, weight: 0.25 },
      { class: GoldResource, weight: 0.05 },
      { class: EmeraldResource, weight: 0.001 },
      { class: GarnetResource, weight: 0.001 },
      { class: ZirconResource, weight: 0.001 },
      { class: AmberResource, weight: 0.001 },
      { class: CaveRock, weight: 0.2 },
      { class: Mushrooms, weight: 0.02 },
      { class: Pot, weight: 0.01 },
      { class: Chest, weight: 0.01 },
      { class: CaveBlock, weight: 0.5 },
    ],
    enemies: [
      // Cave-dwelling creatures
      { class: CrabEnemy, weight: 1.5, minDepth: 0 }, // Crabs like caves
      { class: SpiderEnemy, weight: 1.2, minDepth: 1 }, // Cave spiders
      { class: SkullEnemy, weight: 0.8, minDepth: 0 }, // Ancient cave remains

      // Mid depth cave enemies
      { class: ChargeEnemy, weight: 1.0, minDepth: 2 }, // Charging creatures
      { class: ArmoredzombieEnemy, weight: 0.6, minDepth: 1 }, // Less common undead
      { class: EnergyWizardEnemy, weight: 0.5, minDepth: 1 }, // Rare magic users
      { class: BeetleEnemy, weight: 0.5, minDepth: 1 }, // Rare magic users

      // Deep cave threats
      {
        class: BigSkullEnemy,
        weight: 0.15,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: ArmoredSkullEnemy, weight: 0.7, minDepth: 2 },
      //{ class: MummyEnemy, weight: 0.4, minDepth: 2 }, // Ancient cave mummies
    ],
  },
  [EnvType.FOREST]: {
    props: [
      { class: NullProp, weight: 2 },
      { class: TombStone, weight: 0.035, additionalParams: [1] },
      { class: TombStone, weight: 0.035, additionalParams: [0] },
      { class: Pumpkin, weight: 0.05 },
      { class: Bush, weight: 2 },
      { class: Sprout, weight: 0.05 },
      { class: Mushrooms, weight: 0.05 },
      { class: Rock, weight: 0.1 },
      { class: Chest, weight: 0.01 },
      { class: GlowBugEnemy, weight: 0.05 },
      { class: Tree, weight: 0.1 },
      { class: Succulent, weight: 0.1 },
      { class: SmallBush, weight: 0.5 },
    ],
    enemies: [
      // Nature creatures (higher weights)
      { class: GlowBugEnemy, weight: 1.5, minDepth: 0 },
      { class: FrogEnemy, weight: 0.25, minDepth: 0 }, // Frogs love forests
      { class: BeetleEnemy, weight: 0.1, minDepth: 0 }, // Rare magic users
      //{ class: SpiderEnemy, weight: 0.25, minDepth: 0 }, // Forest spiders

      // Less common forest enemies
      { class: CrabEnemy, weight: 0.3, minDepth: 0 }, // Rare in forest
      { class: ZombieEnemy, weight: 0.2, minDepth: 0 }, // Very rare undead
      { class: SkullEnemy, weight: 0.1, minDepth: 0 }, // Ancient forest spirits

      // Rare magical forest creatures
      { class: EnergyWizardEnemy, weight: 0.2, minDepth: 1 }, // Forest wizards
      { class: EarthWizardEnemy, weight: 0.2, minDepth: 1 },
      //{ class: ChargeEnemy, weight: 0.3, minDepth: 2 }, // Charging forest beasts
      {
        class: BigFrogEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
    ],
  },
  [EnvType.DESERT]: {
    props: [
      { class: NullProp, weight: 2 },
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
    enemies: [
      // Decay and poison themed enemies
      { class: ZombieEnemy, weight: 1.8, minDepth: 0 }, // Swamp zombies
      { class: FrogEnemy, weight: 1.5, minDepth: 1 }, // Poison frogs
      { class: MummyEnemy, weight: 1.0, minDepth: 2 }, // Preserved in swamp
      { class: ArmoredzombieEnemy, weight: 1.2, minDepth: 1 },

      // Other swamp dwellers
      { class: CrabEnemy, weight: 0.8, minDepth: 0 }, // Swamp crabs
      { class: SkullEnemy, weight: 1.0, minDepth: 0 }, // Bog spirits
      { class: SpiderEnemy, weight: 0.6, minDepth: 0 }, // Swamp spiders

      // Powerful swamp creatures
      { class: ArmoredSkullEnemy, weight: 0.8, minDepth: 2 },
      { class: EnergyWizardEnemy, weight: 0.3, minDepth: 1 }, // Swamp witches
    ],
  },
  [EnvType.GLACIER]: {
    props: [
      { class: NullProp, weight: 2 },
      { class: Block, weight: 20 },
      { class: Crate, weight: 5 },
      { class: Rock, weight: 0.6 },
      { class: Chest, weight: 0.4 },
    ],
    enemies: [
      // Ice and cold themed enemies
      { class: CrabEnemy, weight: 1.0, minDepth: 0 }, // Ice crabs
      { class: ChargeEnemy, weight: 1.2, minDepth: 2 }, // Charging ice beasts
      { class: KnightEnemy, weight: 1.0, minDepth: 1 }, // Frozen knights
      {
        class: BigKnightEnemy,
        weight: 0.15,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },

      // Hardy creatures that survive cold
      { class: ArmoredzombieEnemy, weight: 0.8, minDepth: 1 }, // Frozen zombies
      { class: ArmoredSkullEnemy, weight: 0.9, minDepth: 2 }, // Ice spirits
      { class: RookEnemy, weight: 0.7, minDepth: 1 }, // Ice constructs
      { class: BishopEnemy, weight: 0.7, minDepth: 1 },

      // Rare glacier threats
      {
        class: BigSkullEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
    ],
  },
  [EnvType.CASTLE]: {
    props: [
      { class: NullProp, weight: 1 },
      { class: Crate, weight: 2 },
      { class: Barrel, weight: 2 },
      { class: Block, weight: 0.25 },
      { class: PottedPlant, weight: 0.1 },
      { class: Pot, weight: 0.1 },
      { class: Chest, weight: 0.1 },
      { class: Candelabra, weight: 0.5 },
      { class: PawnStatue, weight: 0.75 },
      { class: RookStatue, weight: 0.75 },
      { class: BishopStatue, weight: 0.75 },
      { class: FallenPillar, weight: 0.5, size: { w: 2, h: 1 } },
    ],
    enemies: [
      // Royal guards and castle defenders
      { class: KnightEnemy, weight: 2.0, minDepth: 0 }, // Castle knights
      {
        class: BigKnightEnemy,
        weight: 0.2,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: PawnEnemy, weight: 1.5, minDepth: 0 }, // Castle pawns
      { class: RookEnemy, weight: 1, minDepth: 0 }, // Castle guardians
      { class: BishopEnemy, weight: 1, minDepth: 0 }, // Castle clergy
      { class: QueenEnemy, weight: 0.5, minDepth: 0 }, // Royal enemies
      { class: KingEnemy, weight: 0.125, minDepth: 0 },

      // Castle undead
      { class: ArmoredzombieEnemy, weight: 0.25, minDepth: 0 }, // Fallen guards
      { class: ArmoredSkullEnemy, weight: 0.25, minDepth: 0 }, // Armored spirits

      // Other castle inhabitants
      { class: EnergyWizardEnemy, weight: 0.1, minDepth: 0 }, // Court wizards
      { class: FireWizardEnemy, weight: 0.1, minDepth: 0 }, // Battle mages
      { class: ChargeEnemy, weight: 0.1, minDepth: 0 }, // War beasts
    ],
  },
  [EnvType.DARK_CASTLE]: {
    props: [
      { class: NullProp, weight: 2 },
      { class: DarkCrate, weight: 2 },
      { class: Barrel, weight: 1 },
      { class: DarkPot, weight: 1 },
      { class: DarkVase, weight: 1 },
      { class: Chest, weight: 0.15 },
      { class: DarkPillar, weight: 0.05 },
      { class: PawnStatue, weight: 0.2 },
      { class: RookStatue, weight: 0.2 },
      { class: BishopStatue, weight: 0.2 },
    ],
    enemies: [
      // Chess-themed defenders
      { class: RookEnemy, weight: 1.2, minDepth: 1 },
      { class: BishopEnemy, weight: 1.2, minDepth: 1 },
      { class: KnightEnemy, weight: 1.6, minDepth: 1 },
      { class: PawnEnemy, weight: 1.5, minDepth: 0 }, // Castle pawns
      { class: QueenEnemy, weight: 0.35, minDepth: 2 },
      { class: KingEnemy, weight: 0.125, minDepth: 2 },
      { class: BoltcasterEnemy, weight: 0.25, minDepth: 1 },

      // Court mages
      { class: EnergyWizardEnemy, weight: 0.4, minDepth: 1 },
      { class: FireWizardEnemy, weight: 0.35, minDepth: 2 },

      // Elite guards and constructs
      {
        class: BigKnightEnemy,
        weight: 0.15,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: ArmoredSkullEnemy, weight: 0.8, minDepth: 2 },
    ],
  },
  [EnvType.PLACEHOLDER]: {
    props: [{ class: NullProp, weight: 1 }],
    enemies: [],
  },
  [EnvType.MAGMA_CAVE]: {
    props: [
      { class: NullProp, weight: 1 },
      { class: ObsidianResource, weight: 0.5 },
      // Keep sparse and harsh
      { class: Chest, weight: 0.05 },
      { class: ObsidianBlock, weight: 3 },
      { class: EmeraldResource, weight: 0.025 },
      { class: GarnetResource, weight: 0.025 },
      { class: ZirconResource, weight: 0.025 },
      { class: AmberResource, weight: 0.025 },
    ],
    enemies: [
      // Only high-level, late-game threats
      // Depth 1 enemies
      { class: ArmoredzombieEnemy, weight: 0.8, minDepth: 1 },
      { class: BishopEnemy, weight: 0.6, minDepth: 1 },
      { class: EnergyWizardEnemy, weight: 0.1, minDepth: 1 },
      { class: KnightEnemy, weight: 0.7, minDepth: 1 },
      { class: RookEnemy, weight: 0.6, minDepth: 1 },
      { class: BoltcasterEnemy, weight: 0.25, minDepth: 1 },

      // Depth 2 enemies
      { class: ArmoredSkullEnemy, weight: 0.7, minDepth: 2 },
      {
        class: BigKnightEnemy,
        weight: 0.3,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      {
        class: BigSkullEnemy,
        weight: 0.35,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: BishopEnemy, weight: 0.5, minDepth: 2 },
      { class: ChargeEnemy, weight: 0.5, minDepth: 2 },
      { class: FireWizardEnemy, weight: 0.9, minDepth: 2 },
      { class: MummyEnemy, weight: 0.5, minDepth: 2 },
      { class: QueenEnemy, weight: 0.25, minDepth: 2 },
      { class: SpiderEnemy, weight: 0.5, minDepth: 2 },
    ],
  },
  [EnvType.DARK_DUNGEON]: {
    props: [
      { class: DarkCrate, weight: 1 },
      { class: Barrel, weight: 1 },
      { class: TombStone, weight: 0.01, additionalParams: [1] },
      { class: TombStone, weight: 0.01, additionalParams: [0] },
      { class: Pumpkin, weight: 0.05 },
      { class: Block, weight: 1 },
      { class: DarkPot, weight: 1 },
      { class: DarkVase, weight: 1 },
      { class: Mushrooms, weight: 0.1 },
      { class: Bush, weight: 0.1 },
      { class: Sprout, weight: 0.025 },
      { class: Chest, weight: 0.025 },
      { class: DarkPillar, weight: 0.05 },
      { class: Furnace, weight: 0.05 },
    ],
    enemies: [
      // Early game enemies (depth 0+)
      { class: CrabEnemy, weight: 1.0, minDepth: 0 },
      { class: ZombieEnemy, weight: 1.2, minDepth: 0 },
      { class: SkullEnemy, weight: 1.0, minDepth: 0 },
      { class: SpiderEnemy, weight: 1.0, minDepth: 2 },
      { class: MummyEnemy, weight: 1.0, minDepth: 2 },
      { class: PawnEnemy, weight: 1.0, minDepth: 1 },
      { class: KingEnemy, weight: 0.2, minDepth: 3 },
      { class: BoltcasterEnemy, weight: 0.25, minDepth: 1 },

      // Mid game enemies (depth 1+)
      { class: EnergyWizardEnemy, weight: 0.1, minDepth: 1 },
      { class: RookEnemy, weight: 0.6, minDepth: 1 },
      { class: BishopEnemy, weight: 0.6, minDepth: 1 },
      { class: ArmoredzombieEnemy, weight: 0.8, minDepth: 1 },
      { class: KnightEnemy, weight: 0.7, minDepth: 1 },

      // Late game enemies (depth 2+)
      { class: ChargeEnemy, weight: 0.5, minDepth: 2 },
      {
        class: BigSkullEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: QueenEnemy, weight: 0.2, minDepth: 2 },
      {
        class: BigKnightEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
      { class: FireWizardEnemy, weight: 0.1, minDepth: 2 },
      { class: ArmoredSkullEnemy, weight: 0.5, minDepth: 2 },
      {
        class: BigFrogEnemy,
        weight: 0.1,
        minDepth: 2,
        specialSpawnLogic: "clearFloor",
        size: { w: 2, h: 2 },
      },
    ],
  },
  [EnvType.TUTORIAL]: {
    props: [
      { class: Crate, weight: 1 },
      //{ class: Barrel, weight: 1 },
      //{ class: TombStone, weight: 0.01, additionalParams: [1] },
      //{ class: TombStone, weight: 0.01, additionalParams: [0] },
      { class: Pumpkin, weight: 0.01 },
      { class: Block, weight: 1 },
      { class: Pot, weight: 1 },
      //{ class: PottedPlant, weight: 1 },
      //{ class: Mushrooms, weight: 0.1 },
      //{ class: Bush, weight: 0.1 },
      //{ class: Sprout, weight: 0.025 },
      //{ class: Chest, weight: 0.025 },
      //{ class: DecoBlock, weight: 0.05 },
      //{ class: Furnace, weight: 0.05 },
    ],
    enemies: [
      // Early game enemies (depth 0+)
      { class: CrabEnemy, weight: 1.0, minDepth: 0 },
      { class: ZombieEnemy, weight: 1.2, minDepth: 0 },
      { class: SkullEnemy, weight: 1.0, minDepth: 0 },
      //{ class: MummyEnemy, weight: 1.0, minDepth: 2 },
      { class: PawnEnemy, weight: 1.0, minDepth: 1 },
    ],
  },
};

export { environmentData, PropInfo, EnemyInfo, EnvironmentData };
