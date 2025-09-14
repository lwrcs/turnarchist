import { Item } from "./item";
import { Equippable } from "./equippable";
import { Room } from "../room/room";
import { Sound } from "../sound/sound";
import { Player } from "../player/player";
import { DownLadder } from "src/tile/downLadder";
import { Door } from "../tile/door";
import { Usable } from "./usable/usable";

export class Key extends Usable {
  static itemName = "key";
  doorID: number;
  depth: number;
  room: Room;
  showPath: boolean;
  constructor(level: Room, x: number, y: number) {
    super(level, x, y);

    this.tileX = 1;
    this.tileY = 0;
    this.name = "key";
    this.doorID = 0;
    this.depth = null;
    this.room = level;
    this.showPath = false;
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
    this.showPath = !this.showPath;
    const message = this.showPath ? "Showing path" : "Path hidden";
    this.room.syncKeyPathParticles();

    this.room.game.pushMessage(message);
  };

  tickInInventory = () => {
    //this.updatePathToDoor();
  };

  onDrop = () => {
    this.room.syncKeyPathParticles();
  };

  updatePathToDoor = () => {
    try {
      const player = this.level.game.players[this.level.game.localPlayerID];
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
