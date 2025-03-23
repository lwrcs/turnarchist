import { Direction } from "../game";
import { Entity } from "../entity/entity";

export type PlayerAction =
  | { type: "Move"; direction: Direction }
  | { type: "Interact"; target: { x: number; y: number } }
  | { type: "Attack"; target: Entity }
  | { type: "OpenInventory" }
  | { type: "CloseInventory" }
  | { type: "Restart" };
