import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Input } from "../game/input";
import { Player } from "../player/player";
import { Room } from "../room/room";

export class HoverText {
  static getHoverText(
    x: number,
    y: number,
    room: Room,
    player: Player,
  ): string[] {
    console.log("Getting hover text for position:", x, y);

    // Handle undefined mouse coordinates
    if (Input.mouseX === undefined || Input.mouseY === undefined) {
      console.log("Mouse coordinates undefined, returning empty array");
      return [];
    }

    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;
    console.log("Screen center:", screenCenterX, screenCenterY);

    // Convert pixel offset to tile offset
    const tileOffsetX = Math.floor(
      (Input.mouseX - screenCenterX + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );
    const tileOffsetY = Math.floor(
      (Input.mouseY - screenCenterY + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );
    console.log("Calculated tile offsets:", tileOffsetX, tileOffsetY);

    const offsetX = x + tileOffsetX;
    const offsetY = y + tileOffsetY;

    const strings: string[] = [];
    console.log("Checking entities...");
    for (const entity of room.entities) {
      if (entity.x === offsetX && entity.y === offsetY) {
        console.log("Found matching entity:", entity.hoverText);
        strings.push(entity.hoverText());
      }
    }

    console.log("Checking items...");
    for (const item of room.items) {
      if (item.x === offsetX && item.y === offsetY) {
        console.log("Found matching item:", item.hoverText);
        strings.push(item.hoverText());
      }
    }

    const tile = room.getTile(offsetX, offsetY);
    if (tile) {
      strings.push(tile.getName());
    }

    console.log("Returning hover texts:", strings);
    return strings;
  }

  static draw(delta: number, x: number, y: number, room: Room, player: Player) {
    console.log("Drawing hover text at:", x, y);
    const strings: string[] = HoverText.getHoverText(x, y, room, player);
    if (strings.length === 0) {
      console.log("No hover text to draw");
      return;
    }
    for (const string of strings) {
      const offsetY = strings.indexOf(string) * 6;
      console.log("Drawing text:", string);
      Game.ctx.fillStyle = "yellow";
      Game.ctx.globalAlpha = 0.1;
      Game.fillText(string, 1, 20 + offsetY);
    }
  }
}
