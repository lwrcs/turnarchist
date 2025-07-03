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
  linkedRoom: Room;
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
    super(room, x, y);
    this.game = game;
    this.linkedRoom = null;
    this.depth = room.depth;
    this.isSidePath = isSidePath;
  }

  getName = () => {
    return this.isSidePath ? "rope down" : "staircase down";
  };

  generate = async () => {
    if (!this.linkedRoom) {
      const targetDepth = this.room.depth + (this.isSidePath ? 0 : 1);
      await this.game.levelgen.generate(
        this.game,
        targetDepth,
        this.isSidePath,
        this.handleLinkedRoom,
      );
    } else {
      console.log("LinkedRoom already exists:", this.linkedRoom);
    }
  };

  private handleLinkedRoom = (linkedRoom: Room) => {
    if (this.isSidePath) {
      this.handleSidePathRooms(linkedRoom);
    }

    this.linkedRoom = linkedRoom;
    this.linkUpLadder();
  };

  private handleSidePathRooms = (linkedRoom: Room) => {
    const targetDepth = this.room.depth;
    const level = linkedRoom.level; //this.game.levels[targetDepth];

    const sidePathRooms = this.game.rooms.filter(
      (room) => room.mapGroup === linkedRoom.mapGroup,
    );
    console.log("sidePathRooms", sidePathRooms.length);
    console.log("level.rooms.length", level.rooms.length);
    const startingId = level.rooms.length;
    sidePathRooms.forEach((room, index) => {
      room.id = startingId + index;
      level.rooms.push(room);
    });
  };

  private linkUpLadder = () => {
    for (
      let x = this.linkedRoom.roomX;
      x < this.linkedRoom.roomX + this.linkedRoom.width;
      x++
    ) {
      for (
        let y = this.linkedRoom.roomY;
        y < this.linkedRoom.roomY + this.linkedRoom.height;
        y++
      ) {
        let tile = this.linkedRoom.roomArray[x][y];

        if (tile instanceof UpLadder) {
          this.setUpLadderLink(tile);
          return; // Exit both loops
        }
      }
    }
  };

  private setUpLadderLink = (upLadder: UpLadder) => {
    if (this.isSidePath) {
      upLadder.linkedRoom = this.room;
    } else {
      upLadder.linkedRoom = this.game.levels[this.room.depth].exitRoom;
    }
  };

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
