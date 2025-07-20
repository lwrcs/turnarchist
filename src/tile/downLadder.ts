import { Player } from "../player/player";
import { ChatMessage, Game } from "../game";
import { Room, RoomType } from "../room/room";
import { GameConstants } from "../game/gameConstants";
import { SkinType, Tile } from "./tile";
import { UpLadder } from "./upLadder";
import { EVENTS } from "../event/events";
import { EventEmitter } from "../event/eventEmitter";
import { globalEventBus } from "../event/eventBus";
import { Sound } from "../sound/sound";
import { EnvType } from "../constants/environmentTypes";
import { LightSource } from "../lighting/lightSource";
import { Lockable, LockType } from "./lockable";
import { Key } from "../item/key";
import { Passageway } from "./passageway";

export class DownLadder extends Passageway {
  linkedRoom: Room;
  isSidePath = false;
  depth: number;
  environment: EnvType;
  lockable: Lockable;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    isSidePath: boolean = false,
    environment: EnvType = EnvType.DUNGEON,
    lockType: LockType = LockType.NONE,
  ) {
    super(room, game, x, y);
    this.linkedRoom = null;
    this.depth = room.depth;
    this.isSidePath = isSidePath;
    this.environment = environment;
    const lock = isSidePath ? LockType.NONE : LockType.NONE;

    // Initialize lockable with the passed lockType
    this.lockable = new Lockable(game, {
      lockType: lock,
      isTopDoor: false,
    });

    if (this.lockable.isLocked()) {
      console.log("adding key to downladder");

      this.game.levels[this.depth].distributeKey(this);
    }

    this.addLightSource();
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
        this.environment,
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
    const level = linkedRoom.level;

    const sidePathRooms = this.game.rooms.filter(
      (room) => room.mapGroup === linkedRoom.mapGroup,
    );
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
        this.game.pushMessage("all players must be present");
    }
  };

  draw = (delta: number) => {
    let xx = 4;
    if (this.isSidePath) {
      xx = 16;
      if (this.lockable.isLocked()) xx = 17;
    }
    //if (this.environment === EnvType.FOREST) xx = 16;

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
    // Update lockable animation
    this.lockable.update(delta);

    // Draw lock icon
    this.lockable.drawIcon(this.x, this.y, delta);

    // Update frame using parent method
    this.updateFrame(delta);
  };

  drawAbovePlayer = (delta: number) => {};

  isLocked(): boolean {
    return this.lockable.isLocked();
  }
}
