import { Direction } from "../game";
import { Entity } from "../entity/entity";

export type PlayerAction =
  | { type: "Move"; direction: Direction; targetX: number; targetY: number }
  | {
      type: "MouseMove";
      direction: Direction;
      targetX: number;
      targetY: number;
    }
  | { type: "Interact"; target: { x: number; y: number } }
  | { type: "Attack"; target: Entity } //handled by Interact for the time being
  | { type: "OpenInventory" }
  | { type: "CloseInventory" }
  | { type: "InventoryLeft" }
  | { type: "InventoryRight" }
  | { type: "InventoryUse" }
  | { type: "InventoryDrop" }
  | { type: "InventorySelect"; index: number }
  | { type: "InventoryMove"; fromIndex: number; toIndex: number }
  | { type: "Restart" };
