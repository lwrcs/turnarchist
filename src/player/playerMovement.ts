import type { Player } from "./player";
import { Direction } from "../game";
import { GameConstants } from "../game/gameConstants";
import { TurnState } from "../room/room";

export class PlayerMovement {
  private player: Player;
  private moveQueue: { x: number; y: number; direction: Direction }[] = [];
  private isProcessingQueue: boolean = false;
  private animationFrameId: number | null = null;
  private moveRange: number = 1;
  lastMoveTime: number = 0;
  lastChangeDirectionTime: number = 0;
  adjustedCooldown: number = 0;

  constructor(player: Player) {
    this.player = player;
  }

  move(direction: Direction, targetX?: number, targetY?: number): void {
    if (!(direction in Direction) || !this.player) return;

    const coords = this.getTargetCoords(direction, targetX, targetY);
    if (!coords) return;
    const { x, y } = coords;

    if (this.canMove()) {
      const now = Date.now();
      this.lastMoveTime = now;
      this.lastChangeDirectionTime = now;
      this.player.inputHandler.setMostRecentMoveInput("keyboard");
      this.player.lastDirection = this.player.direction;
      this.player.direction = direction;
      this.player.tryMove(x, y);
    } else {
      this.queueMove(x, y, direction);
    }
  }

  moveMouse(direction: Direction, targetX?: number, targetY?: number): void {
    if (!(direction in Direction) || !this.player) return;

    const coords = this.getTargetCoords(direction, targetX, targetY);
    if (!coords) return;
    console.log("coords", coords.x, coords.y);
    const { x, y } = coords;
    if (x === undefined || y === undefined) return;
    if (this.canMove()) {
      const now = Date.now();
      this.lastMoveTime = now;
      this.player.inputHandler.setMostRecentMoveInput("mouse");
      this.player.direction = direction;
      this.player.tryMove(x, y);
    } else {
      this.queueMove(x, y, direction);
    }
  }
  //unused
  moveRangeCheck = (x: number, y: number) => {
    const dx = Math.abs(this.player.x - x);
    const dy = Math.abs(this.player.y - y);
    return (
      dx <= this.moveRange &&
      dy <= this.moveRange &&
      (dx === 0 || dy === 0) &&
      dx + dy !== 0
    );
  };

  private getTargetCoords(
    direction: Direction,
    x?: number,
    y?: number,
  ): { x: number; y: number } | null {
    if (x !== undefined && y !== undefined) {
      return { x, y };
    }

    switch (direction) {
      case Direction.LEFT:
        return { x: this.player.x - 1, y: this.player.y };
      case Direction.RIGHT:
        return { x: this.player.x + 1, y: this.player.y };
      case Direction.UP:
        return { x: this.player.x, y: this.player.y - 1 };
      case Direction.DOWN:
        return { x: this.player.x, y: this.player.y + 1 };
      default:
        return null;
    }
  }
  inventoryClosedRecently(): boolean {
    const timeSinceDragEnd = Date.now() - this.player.inventory.dragEndTime;
    const timeSinceClose = Date.now() - this.player.inventory.closeTime;
    return timeSinceDragEnd < 10 || timeSinceClose < 10;
  }

  canMove(): boolean {
    if (
      this.inventoryClosedRecently() ||
      (this.player.game.room.turn === TurnState.computerTurn &&
        this.player.game.room.hasEnemyInRadius(this.player.x, this.player.y))
    )
      return false;
    const now = Date.now();
    const cooldown = GameConstants.MOVEMENT_COOLDOWN;
    if (now - this.lastMoveTime >= cooldown) {
      return true;
    }
    return false;
  }

  canQueue(): boolean {
    if (this.inventoryClosedRecently()) return false;
    const now = Date.now();
    const cooldown = GameConstants.MOVEMENT_QUEUE_COOLDOWN;
    if (now - this.lastMoveTime >= cooldown) {
      return true;
    }
    return false;
  }

  queueMove(x: number, y: number, direction: Direction) {
    if (!this.canQueue()) return;
    if (x === undefined || y === undefined || this.moveQueue.length > 0) return;

    this.moveQueue.push({ x, y, direction });
    this.startQueueProcessing();
  }

  private handleMoveLoop({
    x,
    y,
    direction,
  }: {
    x: number;
    y: number;
    direction: Direction;
  }) {
    if (this.player.inputHandler.mostRecentMoveInput === "mouse") {
      this.moveMouse(direction, x, y);
    } else {
      this.move(direction, x, y);
    }
  }

  private startQueueProcessing() {
    if (!this.isProcessingQueue) {
      this.isProcessingQueue = true;
      this.animationFrameId = requestAnimationFrame(() => this.queueHandler());
    }
  }
  private stopQueueProcessing() {
    this.isProcessingQueue = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private queueHandler = () => {
    if (!this.isProcessingQueue) return;

    const now = Date.now();

    const cooldown = GameConstants.MOVEMENT_COOLDOWN;

    if (now - this.lastMoveTime >= cooldown) {
      if (this.moveQueue.length > 0) {
        const nextMove = this.moveQueue.shift();

        this.handleMoveLoop(nextMove);
        this.lastMoveTime = now;
      } else {
        this.stopQueueProcessing();
      }
    }

    this.animationFrameId = requestAnimationFrame(this.queueHandler);
  };
}
