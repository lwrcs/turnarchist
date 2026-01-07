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
import { SidePathManager, SidePathOptions } from "../level/sidePathManager";

export class DownLadder extends Passageway {
  linkedRoom: Room;
  isSidePath = false;
  depth: number;
  environment: EnvType;
  lockable: Lockable;
  opts?: SidePathOptions;
  entryUpLadderPos?: { x: number; y: number };
  private sidePathManager: SidePathManager;

  constructor(
    room: Room,
    game: Game,
    x: number,
    y: number,
    isSidePath: boolean = false,
    environment: EnvType = EnvType.DUNGEON,
    lockType: LockType = LockType.NONE,
    opts?: SidePathOptions,
    lockStateOverride?: { lockType: LockType; keyID?: number },
  ) {
    super(room, game, x, y);
    this.linkedRoom = null;
    this.depth = room.depth;
    this.isSidePath = isSidePath;
    this.environment = environment;
    this.opts = opts;
    this.sidePathManager = new SidePathManager(game);

    // Determine effective lock based on save override, generator intent, or explicit param
    const effectiveLockType = lockStateOverride
      ? lockStateOverride.lockType
      : isSidePath && !GameConstants.DEVELOPER_MODE
        ? LockType.LOCKED
        : lockType;

    // Initialize lockable using effective state (include saved keyID if provided)
    this.lockable = new Lockable(game, {
      lockType: effectiveLockType,
      keyID: lockStateOverride?.keyID,
      isTopDoor: false,
    });

    this.addLightSource();
  }

  getName = () => {
    return this.isSidePath ? "rope down" : "staircase down";
  };

  examineText = (): string => {
    const locked = this.lockable?.isLocked?.() === true;
    if (this.isSidePath) {
      return locked
        ? "A rope down. It's locked."
        : "A rope down. It leads to a side path.";
    }
    return locked ? "A staircase down. It's locked." : "A staircase down.";
  };

  generate = async () => {
    if (!this.linkedRoom) {
      await this.sidePathManager.generateFor(this);
    } else {
      console.log("LinkedRoom already exists:", this.linkedRoom);
    }
  };

  // Linking logic is handled by SidePathManager

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
        this.sidePathManager.switchToPathBeforeTransition(this);
        for (const i in this.game.players) {
          const pl = this.game.players[i];
          pl.anchorOxygenLineToTile(this.room, this.x, this.y, {
            kind: "downLadder",
            angle: Math.PI / 2,
          });
          pl.getOxygenLine()?.update(true);
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
      0, //this.skin,
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
