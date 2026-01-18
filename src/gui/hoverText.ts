import { Game } from "../game";
import { GameConstants } from "../game/gameConstants";
import { Input } from "../game/input";
import { Menu } from "./menu";
import { Player } from "../player/player";
import { Room } from "../room/room";
import { XPCounter } from "./xpCounter";

export class HoverText {
  static getHoverText(
    x: number,
    y: number,
    room: Room,
    player: Player,
    drawFor: "inGame" | "inventory" | "vendingMachine" | "none",
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

    // UI hover text (buttons) should take priority and be screen-space, not tile-space.
    // Keep this lightweight and aligned with existing click bounds.
    try {
      if (
        player.bestiary?.isPointInBestiaryButton(Input.mouseX, Input.mouseY)
      ) {
        strings.push(
          player.bestiary.isOpen ? "Close Bestiary" : "Open Bestiary",
        );
        return strings;
      }
      if (
        player.inventory.isPointInInventoryButton(Input.mouseX, Input.mouseY)
      ) {
        strings.push(
          player.inventory.isOpen ? "Close Inventory" : "Open Inventory",
        );
        return strings;
      }
      if (Menu.isPointInOpenMenuButtonBounds(Input.mouseX, Input.mouseY)) {
        strings.push(player.menu.open ? "Close Menu" : "Open Menu");
        return strings;
      }
      if (XPCounter.isPointInBounds(Input.mouseX, Input.mouseY)) {
        strings.push(player.skillsMenu?.open ? "Close Skills" : "Open Skills");
        return strings;
      }
    } catch {}

    // If we're not drawing hover text for any world/UI context, stop here.
    if (drawFor === "none") {
      return [];
    }

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

    const LINE_HEIGHT = Game.letter_height + 1;
    const margin = 2;
    const widths = strings.map((s) => Game.measureText(s).width);
    const maxW = Math.max(1, ...widths);
    const totalH = strings.length * LINE_HEIGHT;

    const followsMouse =
      (drawFor === "inGame" &&
        GameConstants.IN_GAME_HOVER_TEXT_FOLLOWS_MOUSE) ||
      (drawFor === "inventory" &&
        GameConstants.INVENTORY_HOVER_TEXT_FOLLOWS_MOUSE) ||
      (drawFor === "vendingMachine" &&
        GameConstants.VENDING_MACHINE_HOVER_TEXT_FOLLOWS_MOUSE) ||
      drawFor === "none";

    let baseX = followsMouse ? drawX + 8 : GameConstants.WIDTH / 2 - maxW / 2;
    let baseY = followsMouse ? drawY + 8 : GameConstants.HEIGHT - 32;

    // Clamp the tooltip block fully on-screen.
    baseX = Math.max(
      margin,
      Math.min(GameConstants.WIDTH - margin - maxW, baseX),
    );
    baseY = Math.max(
      margin,
      Math.min(GameConstants.HEIGHT - margin - totalH, baseY),
    );

    Game.ctx.globalAlpha =
      drawFor === "inventory" || drawFor === "none" ? 1 : 0.5;
    Game.ctx.fillStyle = "yellow";

    for (let i = 0; i < strings.length; i++) {
      const s = strings[i];
      const w = widths[i];
      const xLine = Math.round(baseX + (maxW - w) / 2);
      const yLine = Math.round(baseY + i * LINE_HEIGHT);
      Game.fillTextOutline(s, xLine, yLine, "black", "yellow");
    }

    Game.ctx.restore();
  }
}
