// dragDropHandler.ts
import { Inventory } from "./inventory";
import { Input } from "../game/input";

export class DragDropHandler {
  private inventory: Inventory;

  constructor(inventory: Inventory) {
    this.inventory = inventory;
    Input.holdCallback = this.onHoldDetected;
  }

  onHoldDetected = () => {
    this.initiateDrag();
  };

  initiateDrag = () => {
    const { _dragStartItem, _isDragging, _dragStartSlot, items } = this
      .inventory as any;

    if (_dragStartItem == null || _isDragging) return;

    (this.inventory as any)._isDragging = true;
    (this.inventory as any).grabbedItem = _dragStartItem;

    if (_dragStartSlot != null) {
      items[_dragStartSlot] = null;
    }
  };

  update = () => {
    if (Input.mouseDown && Input.isMouseHold) {
      this.initiateDrag();
    } else if (Input.isTapHold) {
      this.initiateDrag();
    }
  };

  clear = () => {
    (this.inventory as any)._isDragging = false;
    (this.inventory as any)._dragStartItem = null;
    (this.inventory as any)._dragStartSlot = null;
    (this.inventory as any).grabbedItem = null;
  };
}
