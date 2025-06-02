import { Player } from "../player/player";
import { ChatMessage, Game } from "../game";
import { Room, RoomType } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { UpLadder } from "./upLadder";
import { EVENTS } from "../event/events";
import { EventEmitter } from "../event/eventEmitter";
import { globalEventBus } from "../event/eventBus";

export class DownLadder extends Tile {
  linkedLevel: Room;
  game: Game;
  isSidePath = false;
  frame: number = 0;
  depth: number;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    isSidePath: boolean = false,
  ) {
    console.log(
      "DownLadder constructor - before super(), isSidePath:",
      isSidePath,
    );
    super(room, x, y);
    this.game = game;
    this.linkedLevel = null;
    this.depth = room.depth;
    this.isSidePath = isSidePath;
    console.log(
      "DownLadder constructor - after isSidePath assignment, this.isSidePath:",
      this.isSidePath,
    );
    console.log("DownLadder constructor - completed successfully");
  }

  generate = async () => {
    if (!this.linkedLevel) {
      const targetDepth = this.room.depth + (this.isSidePath ? 0 : 1);

      await this.game.levelgen.generate(
        this.game,
        targetDepth,
        this.isSidePath,
        (linkedLevel: Room) => {
          if (this.isSidePath) {
            const level = this.game.levels[targetDepth];

            const sidePathRooms = this.game.rooms.filter(
              (room) => room.mapGroup === linkedLevel.mapGroup,
            );

            const startingId = level.rooms.length;
            sidePathRooms.forEach((room, index) => {
              room.id = startingId + index;
              level.rooms.push(room);
            });
          }

          this.linkedLevel = linkedLevel;
          outerLoop: for (
            let x = this.linkedLevel.roomX;
            x < this.linkedLevel.roomX + this.linkedLevel.width;
            x++
          ) {
            for (
              let y = this.linkedLevel.roomY;
              y < this.linkedLevel.roomY + this.linkedLevel.height;
              y++
            ) {
              let tile = this.linkedLevel.roomArray[x][y];

              if (tile instanceof UpLadder) {
                if (this.isSidePath) {
                  tile.linkedLevel = this.room;
                } else {
                  tile.linkedLevel = this.game.levels[this.room.depth].exitRoom;
                }
                break outerLoop;
              }
            }
          }
        },
      );
    } else {
      console.log("LinkedLevel already exists:", this.linkedLevel);
    }
  };

  get linkedRoom() {
    return this.game.levels[this.depth - 1].exitRoom;
  }

  onCollide = (player: Player) => {
    let allPlayersHere = true;
    for (const i in this.game.players) {
      if (
        this.game.levels[this.game.players[i].depth].rooms[
          this.game.players[i].levelID
        ] !== this.room ||
        this.game.players[i].x !== this.x ||
        this.game.players[i].y !== this.y
      ) {
        allPlayersHere = false;
      }
    }
    if (allPlayersHere) {
      globalEventBus.emit(EVENTS.LEVEL_GENERATION_STARTED, {});
      this.generate().then(() => {
        globalEventBus.emit(EVENTS.LEVEL_GENERATION_COMPLETED, {});
        for (const i in this.game.players) {
          this.game.changeLevelThroughLadder(this.game.players[i], this);
        }
      });
    } else {
      if (player === this.game.players[this.game.localPlayerID])
        this.game.chat.push(new ChatMessage("all players must be present"));
    }
  };

  draw = (delta: number) => {
    let xx = 4;
    if (this.isSidePath) xx = 16;

    Game.drawTile(
      1,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
    Game.drawTile(
      xx,
      this.skin,
      1,
      1,
      this.x,
      this.y,
      1,
      1,
      this.room.shadeColor,
      this.shadeAmount(),
    );
  };

  drawAboveShading = (delta: number) => {
    if (this.frame > 100) this.frame = 0;
    this.frame += 1 * delta;
    let multiplier = 0.125;

    Game.drawFX(
      2,
      2,
      1,
      1,
      this.x,
      this.y - 1.25 + multiplier * Math.sin((this.frame * Math.PI) / 50),
      1,
      1,
    );
  };

  drawAbovePlayer = (delta: number) => {};
}
