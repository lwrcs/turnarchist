import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";
import { DownLadder } from "src/tile/downLadder";
import { Door } from "../tile/door";
import { Usable } from "./usable/usable";
import { Game } from "../game";
import { Shadow } from "../drawable/shadow";

export class Key extends Usable {
  static itemName = "key";
  static examineText = "A key. It probably fits one lock.";
  doorID: number;
  depth: number;
  room: Room;
  showPath: boolean;
  animateFrame: number;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 0;
    this.tileY = 4;
    this.name = "key";
    this.doorID = 0;
    this.depth = null;
    this.room = level;
    this.showPath = false;
    this.animateFrame = 0;
  }

  getDescription = (): string => {
    //const ID = this.doorID === 0 ? "" : "ID: " + this.doorID.toString();
    const depth = this.depth !== null ? "Depth: " + this.depth.toString() : "";
    return `KEY\nA key. ${depth}`;
  };

  onPickup = (player: Player) => {
    if (!this.pickedUp) {
      this.pickedUp = player.inventory.addItem(this);
      if (this.pickedUp) {
        this.level.game.pushMessage("You found a key!");
        this.level.game.pushMessage("Click key to toggle path guide");

        Sound.keyPickup();
        if (this.depth === null) this.depth = player.depth;
        console.log(this.depth);
      }
    }
  };

  onUse = (player: Player) => {
    // A key can only be toggled on the floor it belongs to
    if (this.depth === null) this.depth = player.depth;
    if (this.depth !== player.depth) {
      this.room.game.pushMessage("This key doesn't fit on this floor.");
      return;
    }

    // Toggle this key, and ensure all other keys are turned off
    const togglingOn = !this.showPath;

    for (const p of Object.values(this.room.game.players)) {
      for (const it of p.inventory.items) {
        if (it instanceof Key && it !== this) {
          it.showPath = false;
          (it as Key).tileX = 1;
          (it as Key).tileY = 0;
        }
      }
    }

    this.showPath = togglingOn;
    this.tileX = this.showPath ? 2 : 1;
    this.tileY = 0;

    const message = this.showPath ? "Showing path" : "Path hidden";
    // Pass this key and the player context so only this key's path is considered
    this.room.syncKeyPathParticles(this, player);
    this.room.game.pushMessage(message);
  };

  tickInInventory = () => {
    //this.updatePathToDoor();
  };

  onDrop = () => {
    this.showPath = false;
    this.tileX = this.showPath ? 2 : 1;

    this.room.syncKeyPathParticles();
  };

  draw = (delta: number) => {
    Game.ctx.save();
    this.animateFrame += delta / 8;
    if (this.animateFrame >= 8 || this.pickedUp) this.animateFrame = 0;
    if (!this.pickedUp) {
      Game.ctx.globalAlpha = this.alpha;
      if (this.alpha < 1) this.alpha += 0.01 * delta;
      this.drawableY = this.y;
      if (this.inChest) {
        this.chestOffsetY -= Math.abs(this.chestOffsetY + 0.5) * 0.035 * delta;

        if (this.chestOffsetY < -0.47) {
          this.chestOffsetY = -0.5;
        }
      }
      if (this.sineAnimateFactor < 1 && this.chestOffsetY < -0.45)
        this.sineAnimateFactor += 0.2 * delta;
      if (this.scaleFactor > 0) {
        this.scaleFactor *= 0.5 ** delta;
        if (this.scaleFactor < 0.01) this.scaleFactor = 0;
      }
      const scale = 1 / (this.scaleFactor + 1);
      Game.ctx.imageSmoothingEnabled = false;
      Shadow.draw(this.x, this.y, 1, 1);
      //Game.drawItem(0, 0, 1, 1, this.x, this.y, 1, 1);
      this.frame += (delta * (Math.PI * 2)) / 60;
      Game.drawItem(
        Math.floor(this.tileX + this.animateFrame),
        this.tileY,
        1,
        2,
        this.x + this.w * (scale * -0.5 + 0.5) + this.drawOffset,
        this.y +
          this.sineAnimateFactor * Math.sin(this.frame) * 0.07 -
          1 +
          this.offsetY +
          this.h * (scale * -0.5 + 0.5) +
          this.chestOffsetY,
        this.w * scale,
        this.h * scale,
        this.level.shadeColor,
        this.shadeAmount(),
      );
    }
    Game.ctx.restore();
  };
  /*
  outline = () => {
    if (this.showPath) {
      return {
        color: "red",
        opacity: 0.4,
        offset: 1,
        manhattan: true,
      };
    } else {
      return {
        color: "white",
        opacity: 0,
        offset: 0,
        manhattan: false,
      };
    }
  };
*/
  updatePathToDoor = (playerCtx?: Player) => {
    try {
      const player =
        playerCtx || this.level.game.players[this.level.game.localPlayerID];
      const playerRoom = (player as any)?.getRoom?.() || this.level;
      if (!playerRoom) return;

      // Only show path for sidepath downladder with matching key
      const match = this.level.level.findSidepathDownLadderByKeyID(
        playerRoom,
        this.doorID,
      );
      if (!match) {
        // Clear any previous dots if stored on room
        playerRoom.keyPathDots = undefined;
        return;
      }

      const { ladder, room: ladderRoom } = match;

      // If ladder is in the same room, path to its tile (allow drawing on ladder)
      if (ladderRoom === playerRoom) {
        const path = playerRoom.buildTilePathPositions(
          player.x,
          player.y,
          ladder.x,
          ladder.y,
        );
        // Store dots on the room for renderer to consume
        playerRoom.keyPathDots = path;
        return;
      }

      // Otherwise, compute the room-to-room door path and build dots to the first door in this room
      const doorPath: Door[] | null = playerRoom.findShortestDoorPathTo(
        ladderRoom,
        true,
      );
      if (!doorPath || doorPath.length === 0) {
        playerRoom.keyPathDots = undefined;
        return;
      }

      const firstDoor = doorPath[0];
      // Path directly to the door tile (allow drawing on door)
      const path = playerRoom.buildTilePathPositions(
        player.x,
        player.y,
        firstDoor.x,
        firstDoor.y,
      );
      playerRoom.keyPathDots = path;
    } catch (e) {
      // Fail quiet
    }
  };
}
