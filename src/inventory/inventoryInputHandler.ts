// inventoryInputHandler.ts
//NOT IN USE
import { Inventory } from "./inventory";
import { Input } from "../game/input";

export class InventoryInputHandler {
  private inventory: Inventory;

  constructor(inventory: Inventory) {
    this.inventory = inventory;

    Input.mouseDownListeners.push(this.handleMouseDown);
    Input.mouseUpListeners.push(this.handleMouseUp);
    Input.mouseMoveListeners.push(this.handleMouseMove);
    Input.holdCallback = () => this.inventory.onHoldDetected(); // optionally abstract later
  }

  private handleMouseDown = (x: number, y: number, button: number) => {
    this.inventory.handleMouseDown(x, y, button);
  };

  private handleMouseUp = (x: number, y: number, button: number) => {
    this.inventory.handleMouseUp(x, y, button);
  };

  private handleMouseMove = () => {
    this.inventory.mouseMove();
  };
}
