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
      console.log(
        "DownLadder generate - current depth:",
        this.room.depth,
        "target depth:",
        targetDepth,
        "isSidePath:",
        this.isSidePath,
      );
      console.log(
        "Current room ID:",
        this.room.id,
        "Current level rooms count:",
        this.game.levels[this.room.depth].rooms.length,
      );

      await this.game.levelgen.generate(
        this.game,
        targetDepth,
        this.isSidePath,
        (linkedLevel: Room) => {
          console.log(
            "Side path generation callback - linkedLevel:",
            linkedLevel,
          );
          console.log(
            "LinkedLevel mapGroup:",
            linkedLevel.mapGroup,
            "depth:",
            linkedLevel.depth,
          );
          console.log("LinkedLevel ID assigned:", linkedLevel.id);

          if (this.isSidePath) {
            const level = this.game.levels[targetDepth];

            const sidePathRooms = this.game.rooms.filter(
              (room) => room.mapGroup === linkedLevel.mapGroup,
            );

            console.log(
              "Found",
              sidePathRooms.length,
              "side path rooms with mapGroup",
              linkedLevel.mapGroup,
            );

            const startingId = level.rooms.length;
            sidePathRooms.forEach((room, index) => {
              room.id = startingId + index;
              level.rooms.push(room);
            });

            console.log(
              "Level rooms after adding side path:",
              level.rooms.length,
            );
          }

          console.log(
            "Level rooms after side path generation:",
            this.game.levels[targetDepth].rooms.length,
          );

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
                  console.log(
                    "Found UpLadder in side path, linked back to room:",
                    this.room.id,
                    "mapGroup:",
                    this.room.mapGroup,
                  );
                } else {
                  tile.linkedLevel = this.game.levels[this.room.depth].exitRoom;
                  console.log(
                    "Found UpLadder in main path, linked to exit room",
                  );
                }
                break outerLoop;
              }
            }
          }
          console.log("Side path generation completed");
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
    console.log(
      "DownLadder collision - player depth:",
      player.depth,
      "player levelID:",
      player.levelID,
      "ladder isSidePath:",
      this.isSidePath,
    );
    console.log(
      "DownLadder collision - linkedLevel exists:",
      !!this.linkedLevel,
    );
    console.log("Current game levels count:", this.game.levels.length);

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
      console.log("All players here, starting level generation");
      globalEventBus.emit(EVENTS.LEVEL_GENERATION_STARTED, {});
      this.generate().then(() => {
        console.log(
          "About to change level through ladder - linkedLevel:",
          this.linkedLevel,
        );
        console.log(
          "LinkedLevel depth:",
          this.linkedLevel?.depth,
          "roomX:",
          this.linkedLevel?.roomX,
          "roomY:",
          this.linkedLevel?.roomY,
        );
        console.log("LinkedLevel ID:", this.linkedLevel?.id);
        console.log("LinkedLevel level:", this.linkedLevel?.level);
        console.log(
          "Game levels at target depth:",
          this.game.levels[this.linkedLevel.depth],
        );
        globalEventBus.emit(EVENTS.LEVEL_GENERATION_COMPLETED, {});
        for (const i in this.game.players) {
          console.log(
            "Changing level for player",
            i,
            "from depth",
            this.game.players[i].depth,
            "to linkedLevel",
          );
          this.game.changeLevelThroughLadder(this.game.players[i], this);
          console.log(
            "After level change - player depth:",
            this.game.players[i].depth,
            "player levelID:",
            this.game.players[i].levelID,
          );
          console.log(
            "Player position:",
            this.game.players[i].x,
            this.game.players[i].y,
          );
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
