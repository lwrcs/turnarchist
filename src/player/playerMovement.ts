import type { Player } from "./player";
import { Direction } from "../game";
import { GameConstants } from "../game/gameConstants";
import { TurnState } from "../room/room";

type QueueEntry = {
  x: number;
  y: number;
  direction: Direction;
  // Fires when the queued move actually executes (canMove=true and tryMove returned true).
  // Used by the action processor to defer outcome capture to real execution time, so the
  // recorded outcome reflects post-catchUp + post-action state (matching what replay sees).
  onExecuted?: (actualX: number, actualY: number) => void;
};

export class PlayerMovement {
  private player: Player;
  private moveQueue: QueueEntry[] = [];
  private isProcessingQueue: boolean = false;
  private animationFrameId: number | null = null;
  private moveRange: number = 1;
  lastMoveTime: number = 0;
  lastChangeDirectionTime: number = 0;
  adjustedCooldown: number = 0;

  constructor(player: Player) {
    this.player = player;
  }

  private toCardinalDirection(dir: Direction): Direction {
    switch (dir) {
      case Direction.UP_LEFT:
      case Direction.UP_RIGHT:
        return Direction.UP;
      case Direction.DOWN_LEFT:
      case Direction.DOWN_RIGHT:
        return Direction.DOWN;
      default:
        return dir;
    }
  }

  move(
    direction: Direction,
    targetX?: number,
    targetY?: number,
    onExecuted?: (actualX: number, actualY: number) => void,
  ): boolean {
    if (!(direction in Direction) || !this.player) return false;

    const coords = this.getTargetCoords(direction, targetX, targetY);
    if (!coords) return false;
    const { x, y } = coords;

    if (this.canMove()) {
      // tryMove() reports whether it actually mutated state. We only commit cooldown
      // and "productive" status if it did — wall bumps, busy/transition guards, and
      // dead-player guards report false and must not advance lastMoveTime or be recorded.
      this.player.inputHandler.setMostRecentMoveInput("keyboard");
      this.player.lastDirection = this.player.direction;
      this.player.direction = this.toCardinalDirection(direction);
      const productive = this.player.tryMove(x, y);
      if (productive) {
        const now = Date.now();
        this.lastMoveTime = now;
        this.lastChangeDirectionTime = now;
        // Outcome callback fires AFTER tryMove (and its inner catchUp + room.tick).
        // Caller captures post-execution game state — same moment in both recording
        // (immediate path here) and replay.
        onExecuted?.(x, y);
      }
      return productive;
    } else {
      if (!this.enemyTurnInputLockActive()) {
        return this.queueMove(x, y, direction, onExecuted);
      }
      return false;
    }
  }

  moveMouse(
    direction: Direction,
    targetX?: number,
    targetY?: number,
    onExecuted?: (actualX: number, actualY: number) => void,
  ): boolean {
    if (!(direction in Direction) || !this.player || GameConstants.isMobile)
      return false;

    const coords = this.getTargetCoords(direction, targetX, targetY);
    if (!coords) return false;
    const { x, y } = coords;
    if (x === undefined || y === undefined) return false;
    if (this.canMove()) {
      this.player.inputHandler.setMostRecentMoveInput("mouse");
      this.player.direction = direction;
      const productive = this.player.tryMove(x, y);
      if (productive) {
        this.lastMoveTime = Date.now();
        onExecuted?.(x, y);
      }
      return productive;
    } else {
      if (!this.enemyTurnInputLockActive()) {
        return this.queueMove(x, y, direction, onExecuted);
      }
      return false;
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
    if (x !== undefined && y !== undefined && x !== null && y !== null) {
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
      case Direction.UP_LEFT:
        return { x: this.player.x - 1, y: this.player.y - 1 };
      case Direction.UP_RIGHT:
        return { x: this.player.x + 1, y: this.player.y - 1 };
      case Direction.DOWN_LEFT:
        return { x: this.player.x - 1, y: this.player.y + 1 };
      case Direction.DOWN_RIGHT:
        return { x: this.player.x + 1, y: this.player.y + 1 };
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
    if (this.player.busyAnimating) return false;
    if (this.enemyTurnInputLockActive()) return false;

    const now = Date.now();
    let cooldown = GameConstants.MOVEMENT_COOLDOWN;

    // Apply slower cooldown when enemies are nearby and setting is enabled
    if (
      GameConstants.SLOW_INPUTS_NEAR_ENEMIES &&
      this.player.game.room.hasEnemyInRadius(this.player.x, this.player.y)
    ) {
      cooldown *= 2; // Double the cooldown when enemies are nearby
    }

    if (now - this.lastMoveTime >= cooldown) {
      return true;
    }
    return false;
  }

  canQueue(): boolean {
    if (this.player.busyAnimating) return false;
    if (this.enemyTurnInputLockActive()) return false;
    const now = Date.now();
    let cooldown = GameConstants.MOVEMENT_QUEUE_COOLDOWN;

    // Apply slower queue cooldown when enemies are nearby and setting is enabled

    if (
      GameConstants.SLOW_INPUTS_NEAR_ENEMIES &&
      this.player.game.room.hasEnemyInRadius(this.player.x, this.player.y)
    ) {
      cooldown *= 2; // Double the queue cooldown when enemies are nearby
    }

    if (now - this.lastMoveTime >= cooldown) {
      return true;
    }
    return false;
  }

  queueMove(
    x: number,
    y: number,
    direction: Direction,
    onExecuted?: (actualX: number, actualY: number) => void,
  ): boolean {
    if (!this.canQueue()) return false;
    if (x === undefined || y === undefined || this.moveQueue.length > 0) return false;

    this.moveQueue.push({ x, y, direction, onExecuted });
    this.startQueueProcessing();
    return true;
  }

  private handleMoveLoop(entry: QueueEntry): boolean {
    const { x, y, direction, onExecuted } = entry;
    if (this.player.inputHandler.mostRecentMoveInput === "mouse") {
      return this.moveMouse(direction, x, y, onExecuted);
    } else {
      return this.move(direction, x, y, onExecuted);
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
        // Always shift the entry off the queue. handleMoveLoop calls move() which
        // re-queues internally if canMove() is transiently false (cooldown not yet
        // elapsed, busy animation in flight) — so legitimate retries are preserved
        // without us needing to retain the entry here. Entries that can NEVER
        // succeed (out-of-bounds target, dead player, level transitioning) drop
        // here, which is correct: the callback-based recording in
        // playerActionProcessor only fires on actual execution, so a dropped entry
        // is never recorded.
        const nextMove = this.moveQueue.shift()!;
        this.handleMoveLoop(nextMove);
        this.lastMoveTime = now;
      } else {
        this.stopQueueProcessing();
      }
    }

    this.animationFrameId = requestAnimationFrame(this.queueHandler);
  };

  private enemyTurnInputLockActive(): boolean {
    if (!GameConstants.SLOW_INPUTS_NEAR_ENEMIES) return false;
    const room = this.player?.game?.room;
    if (!room) return false;
    if (room.turn !== TurnState.computerTurn) return false;
    return room.hasEnemyInRadius(this.player.x, this.player.y);
  }
}
