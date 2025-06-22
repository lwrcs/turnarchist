import { Barrel } from "../entity/object/barrel";
import { Block } from "../entity/object/block";
import { Crate } from "../entity/object/crate";
import { Pumpkin } from "../entity/object/pumpkin";
import { TombStone } from "../entity/object/tombStone";
import { Game } from "../game";
import { GameplaySettings } from "../game/gameplaySettings";
import { EnvType, environmentProps, PropInfo } from "../level/environment";
import { Level } from "../level/level";
import { Random } from "../utility/random";
import { Utils } from "../utility/utils";
import { ClusteringOptions, PropClusterer } from "./propClusterer";
import { Room, RoomType } from "./room";

export class Populator {
  level: Level;
  medianDensity: number;
  private props: { x: number; y: number }[] = [];

  constructor(level: Level) {
    this.level = level;
    this.props = [];
    this.medianDensity = GameplaySettings.MEDIAN_ROOM_DENSITY;
  }

  populateRooms = () => {
    this.level.rooms.forEach((room) => {
      if (
        room.type === RoomType.START ||
        room.type === RoomType.DOWNLADDER ||
        room.type === RoomType.UPLADDER ||
        room.type === RoomType.ROPEHOLE
      )
        return;

      this.populateByEnvironment(room);
    });
  };

  populateByEnvironment = (room: Room) => {
    switch (room.envType) {
      case EnvType.CAVE:
        this.populateCave(room);
        break;
      case EnvType.FOREST:
        this.populateForest(room);
        break;
      default:
        this.populateDefault(room);
        break;
    }
  };

  populateByType = (room: Room) => {};

  private addProps(room: Room, numProps: number, envType?: EnvType) {
    const envData = envType
      ? environmentProps[envType]
      : environmentProps[room.level.environment.type];
    let tiles = room.getEmptyTiles();

    for (let i = 0; i < numProps; i++) {
      if (tiles.length === 0) break;

      const { x, y } = room.getRandomEmptyPosition(tiles);
      const selectedProp = Utils.randTableWeighted(envData.props);

      if (selectedProp && selectedProp.class && selectedProp.class.add) {
        const args = selectedProp.additionalParams || [];
        selectedProp.class.add(room, room.game, x, y, ...args);
      }
    }
  }

  /**
   * Adds props with clustering behavior - entities are more likely to be placed near existing entities
   * @param room - The room to populate
   * @param numProps - Number of props to place
   * @param envType - Environment type for prop selection
   * @param clusteringOptions - Optional clustering configuration
   */
  private addPropsWithClustering(
    room: Room,
    numProps: number,
    envType?: EnvType,
    clusteringOptions?: ClusteringOptions,
  ) {
    const envData = envType
      ? environmentProps[envType]
      : environmentProps[room.level.environment.type];

    const clusterer = new PropClusterer(room, clusteringOptions);
    const positions = clusterer.generateClusteredPositions(numProps);

    for (const { x, y } of positions) {
      const selectedProp = Utils.randTableWeighted(envData.props);

      if (selectedProp && selectedProp.class && selectedProp.class.add) {
        const args = selectedProp.additionalParams || [];
        selectedProp.class.add(room, room.game, x, y, ...args);
      }
    }
  }

  private populateDungeon(room: Room) {
    this.populateDefault(room);
  }

  private populateGraveyard(room: Room) {
    this.populateDefault(room);
  }

  private populateCave(room: Room) {
    const numProps = this.getNumProps(room);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });
  }

  private populateForest(room: Room) {
    const numProps = this.getNumProps(room, 0.75);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });
  }

  private getNumProps(room: Room, medianDensity?: number) {
    medianDensity = medianDensity || this.medianDensity;
    const numEmptyTiles = room.getEmptyTiles().length;
    const numProps = Utils.randomNormalInt(0, numEmptyTiles, {
      median: Math.ceil(medianDensity * numEmptyTiles),
    });
    const percentFull = Math.round((numProps / numEmptyTiles) * 100);
    console.log("percentFull", `${percentFull}%`);
    return numProps;
  }

  private populateDefault(room: Room) {
    const numProps = this.getNumProps(room);
    //this.addProps(room, numProps, room.envType);
    this.addPropsWithClustering(room, numProps, room.envType, {
      falloffExponent: 2,
      baseScore: 0.1,
      maxInfluenceDistance: 12,
      useSeedPosition: false,
    });
  }
}
