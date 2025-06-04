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
  constructor(level: Level) {
    this.level = level;
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

      // Get environment-specific data
      const numEmptyTiles = room.getEmptyTiles().length;

      // Calculate spawn count based on unified density multiplier
      const numProps = Utils.randomSineInt(0, 0.3 * numEmptyTiles);

      switch (room.type) {
        case RoomType.DUNGEON:
          this.populateDungeon(room);
          break;
        case RoomType.CAVE:
          this.populateCave(room);
          break;
        default:
          this.addProps(room, numProps);
          break;
      }
    });
  };

  private addProps(room: Room, numProps: number) {
    const envData = environmentProps[room.level.environment.type];
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

  private populateDungeon(room: Room) {}

  private populateCave(room: Room) {}
}
