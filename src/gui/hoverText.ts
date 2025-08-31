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
    inventoryOpen: boolean,
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
    if (
      !inventoryOpen &&
      !player.inventory.isPointInQuickbarBounds(x, y).inBounds
    ) {
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
    } else {
      if (player.inventory.itemAtSelectedSlot()) {
        strings.push(player.inventory.itemAtSelectedSlot()?.hoverText());
      }
    }

    return strings;
  }

  static draw(
    delta: number,
    x: number,
    y: number,
    room: Room,
    player: Player,
    drawX: number,
    drawY: number,
    inventoryOpen: boolean = false,
  ) {
    const strings: string[] = HoverText.getHoverText(
      x,
      y,
      room,
      player,
      inventoryOpen,
    );
    if (strings.length === 0) {
      return;
    }
    Game.ctx.save();
    for (const string of strings) {
      const offsetY = strings.indexOf(string) * 6;
      if (inventoryOpen) {
        Game.ctx.globalAlpha = 1;
      } else {
        Game.ctx.globalAlpha = 0.5;
      }
      Game.ctx.fillStyle = "yellow";

      const offsetX = Game.measureText(string).width / 2;
      let posX =
        GameConstants.HOVER_TEXT_FOLLOWS_MOUSE && !inventoryOpen
          ? drawX + 8
          : GameConstants.WIDTH / 2 - offsetX;
      let posY =
        GameConstants.HOVER_TEXT_FOLLOWS_MOUSE && !inventoryOpen
          ? drawY + 8 // + offsetY
          : GameConstants.HEIGHT - 32;
      //Game.fillText(string, drawX, drawY + offsetY);
      if (GameConstants.HOVER_TEXT_FOLLOWS_MOUSE) {
        posX = Input.mouseX + 8;
        posY = Input.mouseY + 4;
      }
      //Game.ctx.globalCompositeOperation = "destination-out";
      Game.fillTextOutline(string, posX, posY, "black", "yellow");
    }
    Game.ctx.restore();
  }
}
