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
    drawFor: "inGame" | "inventory" | "vendingMachine" | "none",
  ): string[] {
    // Handle undefined mouse coordinates
    if (
      Input.mouseX === undefined ||
      Input.mouseY === undefined ||
      drawFor === "none"
    ) {
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
      drawFor === "inGame" &&
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
    } else if (drawFor === "inventory") {
      if (player.inventory.itemAtSelectedSlot()) {
        strings.push(player.inventory.itemAtSelectedSlot()?.hoverText());
      }
    } else {
      if (player.openVendingMachine) {
        strings.push(player.openVendingMachine.hoverText());
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
    drawFor: "inGame" | "inventory" | "vendingMachine" | "none",
  ) {
    const strings: string[] = HoverText.getHoverText(
      x,
      y,
      room,
      player,
      drawFor,
    );
    if (strings.length === 0) {
      return;
    }
    Game.ctx.save();
    if (drawFor === "none") {
      return;
    }
    for (const string of strings) {
      const offsetY = strings.indexOf(string) * 6;
      if (drawFor === "inventory") {
        Game.ctx.globalAlpha = 1;
      } else {
        Game.ctx.globalAlpha = 0.5;
      }
      Game.ctx.fillStyle = "yellow";

      const offsetX = Game.measureText(string).width / 2;

      let posX = x;
      let posY = y;

      switch (drawFor) {
        case "inGame":
          posX = GameConstants.IN_GAME_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawX + 8
            : GameConstants.WIDTH / 2 - offsetX;
          posY = GameConstants.IN_GAME_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawY + 8 // + offsetY
            : GameConstants.HEIGHT - 32;
          break;
        case "inventory":
          posX = GameConstants.INVENTORY_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawX + 8
            : GameConstants.WIDTH / 2 - offsetX;
          posY = GameConstants.INVENTORY_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawY + 8 // + offsetY
            : GameConstants.HEIGHT - 32;
          break;
        case "vendingMachine":
          posX = GameConstants.VENDING_MACHINE_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawX + 8
            : GameConstants.WIDTH / 2 - offsetX;
          posY = GameConstants.VENDING_MACHINE_HOVER_TEXT_FOLLOWS_MOUSE
            ? drawY + 8 // + offsetY
            : GameConstants.HEIGHT - 32;
          break;
      }

      //Game.ctx.globalCompositeOperation = "destination-out";
      Game.fillTextOutline(string, posX, posY, "black", "yellow");
    }
    Game.ctx.restore();
  }
}
