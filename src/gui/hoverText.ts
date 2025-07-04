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
    // Handle undefined mouse coordinates
    if (Input.mouseX === undefined || Input.mouseY === undefined) {
      return [];
    }

    // Get screen center coordinates
    const screenCenterX = GameConstants.WIDTH / 2;
    const screenCenterY = GameConstants.HEIGHT / 2;

    // Convert pixel offset to tile offset
    const tileOffsetX = Math.floor(
      (Input.mouseX - screenCenterX + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );
    const tileOffsetY = Math.floor(
      (Input.mouseY - screenCenterY + GameConstants.TILESIZE / 2) /
        GameConstants.TILESIZE,
    );

    const offsetX = x + tileOffsetX;
    const offsetY = y + tileOffsetY;

    const strings: string[] = [];
    for (const entity of room.entities) {
      if (entity.x === offsetX && entity.y === offsetY) {
        strings.push(entity.hoverText());
      }
    }

    for (const item of room.items) {
      if (item.x === offsetX && item.y === offsetY) {
        strings.push(item.hoverText());
      }
    }

    const tile = room.getTile(offsetX, offsetY);
    if (tile) {
      strings.push(tile.getName());
    }

    return strings;
  }

  static draw(delta: number, x: number, y: number, room: Room, player: Player) {
    const strings: string[] = HoverText.getHoverText(x, y, room, player);
    if (strings.length === 0) {
      return;
    }
    Game.ctx.save();
    for (const string of strings) {
      const offsetY = strings.indexOf(string) * 6;
      Game.ctx.fillStyle = "yellow";
      Game.ctx.globalAlpha = 0.1;
      Game.fillText(string, 1, 20 + offsetY);
    }
    Game.ctx.restore();
  }
}
