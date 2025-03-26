import { Item } from "./item";
import { Player } from "../player/player";
import { Game } from "../game";
import { Room, RoomType } from "../room/room";
import { TextParticle } from "../particle/textParticle";
import { GameConstants } from "../gameConstants";
import { Usable } from "./usable";
import { DownLadder } from "../tile/downLadder";

export class GodStone extends Usable {
  room: Room;
  count: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);
    this.room = level;
    this.count = 0;
    this.tileX = 31;
    this.tileY = 0;

    this.stackable = true;
  }
  onUse = (player: Player): void => {
    this.teleportToExit(player);
  };
  teleportToExit = (player: Player): void => {
    let downLadders = this.room.game.rooms.filter(
      (room) => room.type === RoomType.DOWNLADDER,
    );
    console.log("downLadders", downLadders);
    const room = downLadders[downLadders.length - 1];
    this.room.game.rooms.forEach((room) => {
      room.entered = true;
      room.calculateWallInfo();
    });
    room.game.changeLevelThroughDoor(player, room.doors[0], 1);
    player.x = room.roomX + 2;
    player.y = room.roomY + 3;
  };
  getDescription = (): string => {
    return "YOU SHOULD NOT HAVE THIS";
  };
}
