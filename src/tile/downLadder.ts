import { Player } from "../player";
import { ChatMessage, Game } from "../game";
import { Room } from "../room";
import { GameConstants } from "../gameConstants";
import { SkinType, Tile } from "./tile";
import { UpLadder } from "./upLadder";
import { EVENTS } from "../events";
import { EventEmitter } from "../eventEmitter";
import { globalEventBus } from "../eventBus";

export class DownLadder extends Tile {
  linkedLevel: Room;
  game: Game;
  isRope = false;
  frame: number = 0;
  depth: number;

  constructor(room: Room, game: Game, x: number, y: number) {
    super(room, x, y);
    this.game = game;
    this.linkedLevel = null;
    this.depth = room.depth;
  }

  generate = async () => {
    if (!this.linkedLevel) {
      await this.game.levelgen.generate(
        this.game,
        this.room.depth + (this.isRope ? 0 : 1),
        this.isRope,
        (linkedLevel: Room) => {
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
                tile.linkedLevel = this.game.levels[this.room.depth].exitRoom;
                console.log("linked level", tile.linkedLevel);
                break outerLoop;
              }
            }
          }
        },
      );
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
        console.log("player not here", this.game.players[i]);
        console.log(
          `this.game.players[i].levelID: ${this.game.players[i].levelID}`,
        );
        console.log(`this.room.id: ${this.room.id}`);
        console.log(
          `this.game.players[i].x, this.game.players[i].y: ${this.game.players[i].x}, ${this.game.players[i].y}, this.x, this.y: ${this.x}, ${this.y}`,
        );
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
    if (this.isRope) xx = 16;

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
