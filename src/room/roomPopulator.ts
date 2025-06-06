import { Barrel } from "../entity/object/barrel";
import { Block } from "../entity/object/block";
import { Crate } from "../entity/object/crate";
import { Pumpkin } from "../entity/object/pumpkin";
import { TombStone } from "../entity/object/tombStone";
import { Game } from "../game";
import { EnvType, environmentProps, PropInfo } from "../level/environment";
import { Level } from "../level/level";
import { Random } from "../utility/random";
import { Utils } from "../utility/utils";
import { Room, RoomType } from "./room";

export class Populator {
  level: Level;
  private props: { x: number; y: number }[] = [];

  constructor(level: Level) {
    this.level = level;
    this.props = [];
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

      switch (room.type) {
        case RoomType.DUNGEON:
          this.populateDungeon(room);
          break;
        case RoomType.CAVE:
          this.populateCave(room);
          break;
        case RoomType.FOREST:
          this.populateForest(room);
          break;
        default:
          this.populateDefault(room);
          break;
      }
    });
  };

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

  private populateDungeon(room: Room) {
    this.populateDefault(room);
  }

  private populateGraveyard(room: Room) {
    this.populateDefault(room);
  }

  private populateCave(room: Room) {
    this.addProps(room, this.getNumProps(room), EnvType.CAVE);
  }

  private populateForest(room: Room) {
    if (Math.random() < 0.05) {
      this.populateGraveyard(room);
    } else this.addProps(room, this.getNumProps(room), EnvType.FOREST);
  }

  private getNumProps(room: Room) {
    const numEmptyTiles = room.getEmptyTiles().length;
    return Utils.randomSineInt(0, 0.3 * numEmptyTiles);
  }

  private populateDefault(room: Room) {
    const numProps = this.getNumProps(room);
    this.addProps(room, numProps);
  }
}
