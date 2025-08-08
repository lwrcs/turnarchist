import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Room, RoomType } from "../room/room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../game/gameConstants";
import { Usable } from "./usable/usable";
import { DownLadder } from "../tile/downLadder";

export class GodStone extends Usable {
  count: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.count = 0;
    this.tileX = 31;
    this.tileY = 0;

    this.stackable = true;
  }

  onUse = (player: Player): void => {
    this.teleportToExit(player);
  };
  teleportToExit = (player: Player): void => {
    let downLadders = this.level.game.rooms.filter(
      (room) => room.type === RoomType.DOWNLADDER,
    );
    console.log("downLadders", downLadders);
    const targetRoom = downLadders[downLadders.length - 1];
    this.level.game.rooms.forEach((r) => {
      r.entered = true;
      r.calculateWallInfo();
    });
    targetRoom.game.changeLevelThroughDoor(player, targetRoom.doors[0], 1);
    player.x = targetRoom.roomX + 2;
    player.y = targetRoom.roomY + 3;
  };
  getDescription = (): string => {
    return "YOU SHOULD NOT HAVE THIS";
  };
}
