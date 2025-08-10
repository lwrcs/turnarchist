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
  opts?: { caveRooms?: number; mapWidth?: number; mapHeight?: number };

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    isSidePath: boolean = false,
    environment: EnvType = EnvType.DUNGEON,
    lockType: LockType = LockType.NONE,
    opts?: { caveRooms?: number; mapWidth?: number; mapHeight?: number },
  ) {
    super(room, game, x, y);
    this.linkedRoom = null;
    this.depth = room.depth;
    this.isSidePath = isSidePath;
    this.environment = environment;
    this.opts = opts;
    const lock =
      isSidePath && !GameConstants.DEVELOPER_MODE
        ? LockType.LOCKED
        : LockType.NONE;

    // Initialize lockable with the passed lockType
    this.lockable = new Lockable(game, {
      lockType: lock,
      isTopDoor: false,
    });

    this.addLightSource();
  }

  getName = () => {
    return this.isSidePath ? "rope down" : "staircase down";
  };

  generate = async () => {
    if (!this.linkedRoom) {
      const targetDepth = this.room.depth + (this.isSidePath ? 0 : 1);
      // Assign a deterministic pathId for this sidepath based on coordinates (stable across runs)
      // Include parent path to allow nested sidepaths to be unique
      const parentPid: string = (this.game as any).currentPathId || "main";
      const roomAnchor = `${this.room.depth}:${this.room.roomX},${this.room.roomY}`;
      const tileAnchor = `${this.x},${this.y}`;
      const coordPid = `sp:${parentPid}:${roomAnchor}:${tileAnchor}`;
      const legacyGid: string =
        ((this as any).globalId as string) ||
        `${(this.room as any).globalId}:${this.x},${this.y}`;
      // Prefer coordinate-based pid; fall back to legacy GID-based for old saves
      const pathId = this.isSidePath ? coordPid : "main";
      await this.game.levelgen.generate(
        this.game,
        targetDepth,
        this.isSidePath,
        this.handleLinkedRoom,
        this.environment,
        false,
        pathId,
        // Optionally make some caves smaller; tweak or randomize as desired
        this.opts,
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
      const pl = this.game.players[i];
      const plRoom = (pl as any).getRoom
        ? (pl as any).getRoom()
        : this.game.levels[pl.depth].rooms[pl.levelID];
      if (plRoom !== this.room || pl.x !== this.x || pl.y !== this.y) {
        allPlayersHere = false;
      }
    }
    if (allPlayersHere) {
      globalEventBus.emit(EVENTS.LEVEL_GENERATION_STARTED, {});
      this.generate().then(() => {
        globalEventBus.emit(EVENTS.LEVEL_GENERATION_COMPLETED, {});
        // Switch active path to this ladder's sidepath before transitioning
        if (this.isSidePath && this.linkedRoom) {
          (this.game as any).currentPathId =
            this.linkedRoom.pathId ||
            (this.game as any).currentPathId ||
            "main";
        }
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
