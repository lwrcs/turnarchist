import type { Player } from "./player";
import { Direction } from "../game";
import { GameConstants } from "../gameConstants";

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

  move(direction: Direction): void {
    const { x, y } = this.getTargetCoords(direction);

    if (this.canMove()) {
      this.player.inputHandler.mostRecentMoveInput = "keyboard";
      this.player.lastDirection = this.player.direction;
      this.player.direction = direction;
      this.player.tryMove(x, y);
    } else {
      this.queueMove(x, y, direction);
    }
  }

  moveMouse(direction: Direction): void {
    const { x, y } = this.getTargetCoords(direction);
    console.log("x", x, "y", y);

    if (this.canMove()) {
      this.player.inputHandler.mostRecentMoveInput = "mouse";
      //this.player.lastDirection = this.player.direction;
      //this.player.direction = direction;
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

  private getTargetCoords(direction: Direction): { x: number; y: number } {
    switch (direction) {
      case Direction.LEFT:
        return { x: this.player.x - 1, y: this.player.y };
      case Direction.RIGHT:
        return { x: this.player.x + 1, y: this.player.y };
      case Direction.UP:
        return { x: this.player.x, y: this.player.y - 1 };
      case Direction.DOWN:
        return { x: this.player.x, y: this.player.y + 1 };
    }
  }

  canMove(): boolean {
    const now = Date.now();
    const cooldown = GameConstants.MOVEMENT_COOLDOWN;
    /*
    this.adjustedCooldown = cooldown - this.moveQueue.length * 25;
    this.player.cooldownRemaining =
      now - this.lastMoveTime / this.adjustedCooldown;
          */

    if (now - this.lastMoveTime >= cooldown) {
      this.lastMoveTime = now;
      if (this.player.inputHandler.mostRecentMoveInput === "keyboard")
        this.lastChangeDirectionTime = now;
      return true;
    }
    return false;
  }

  canQueue(): boolean {
    const now = Date.now();
    const cooldown = GameConstants.MOVEMENT_QUEUE_COOLDOWN;

    if (now - this.lastMoveTime >= cooldown) {
      //this.lastMoveTime = now;
      //this.lastChangeDirectionTime = now;
      return true;
    }
    return false;
  }

  queueMove(x: number, y: number, direction: Direction) {
    if (!this.canQueue()) return;
    if (!x || !y || this.moveQueue.length > 0) return;

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
    this.move(direction);
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
