// src/entity/ai/enemyAIHandler.ts
import { astar } from "../utility/astarclass";
import { Direction } from "../game";
import { SpikeTrap } from "./../tile/spiketrap";
import { Enemy } from "./enemy/enemy";

export class EnemyAIHandler {
  constructor(private enemy: Enemy) {}

  tick(): void {
    if (this.enemy.skipNextTurns > 0) {
      this.enemy.skipNextTurns--;
      return;
    }

    if (!this.enemy.seenPlayer) {
      this.lookForPlayer();
      return;
    }

    if (this.enemy.room.playerTicked === this.enemy.targetPlayer) {
      this.enemy.alertTicks = Math.max(0, this.enemy.alertTicks - 1);
      this.moveTowardTarget();
      this.retargetIfBetterPlayerIsCloser();
    }
  }

  private lookForPlayer(): void {
    const playerData = this.enemy.nearestPlayer();
    if (playerData !== false) {
      const [distance, player] = playerData;
      if (distance <= 4) {
        this.enemy.targetPlayer = player;
        this.enemy.facePlayer(player);
        this.enemy.seenPlayer = true;
        if (player === this.enemy.game.players[this.enemy.game.localPlayerID]) {
          this.enemy.alertTicks = 1;
        }
        this.enemy.makeHitWarnings?.();
      }
    }
  }

  private moveTowardTarget(): void {
    const { x: oldX, y: oldY } = this.enemy;
    const disablePositions = this.getBlockedPositions();
    const grid = this.buildGrid();

    const moves = astar.AStar.search(
      grid,
      this.enemy,
      this.enemy.targetPlayer,
      disablePositions,
      false,
      false,
      true,
      this.enemy.direction,
    );

    if (moves.length === 0) return;

    const nextMove = moves[0].pos;
    const { x: moveX, y: moveY } = nextMove;

    const intendedDirection = this.getDirectionFromDelta(
      moveX - oldX,
      moveY - oldY,
    );

    if (intendedDirection !== this.enemy.direction) {
      // Turn only
      this.enemy.direction = intendedDirection;
      return;
    }

    // Direction is aligned, proceed to move or attack
    if (!this.attackIfPlayerAt(moveX, moveY)) {
      this.enemy.tryMove(moveX, moveY);
      this.enemy.setDrawXY(oldX, oldY);
    }

    this.applyDirectionalAvoidance(disablePositions);
    this.enemy.makeHitWarnings?.();
  }

  private getDirectionFromDelta(dx: number, dy: number): Direction {
    if (dx > 0) return Direction.RIGHT;
    if (dx < 0) return Direction.LEFT;
    if (dy > 0) return Direction.DOWN;
    return Direction.UP;
  }

  private attackIfPlayerAt(x: number, y: number): boolean {
    for (const player of Object.values(this.enemy.game.players)) {
      if (
        this.enemy.game.rooms[player.levelID] === this.enemy.room &&
        player.x === x &&
        player.y === y
      ) {
        player.hurt(this.enemy.hit(), this.enemy.name);
        this.enemy.drawX = 0.5 * (this.enemy.x - player.x);
        this.enemy.drawY = 0.5 * (this.enemy.y - player.y);
        if (player === this.enemy.game.players[this.enemy.game.localPlayerID]) {
          this.enemy.game.shakeScreen(
            10 * this.enemy.drawX,
            10 * this.enemy.drawY,
          );
        }
        return true;
      }
    }
    return false;
  }

  private getBlockedPositions(): astar.Position[] {
    const disablePositions: astar.Position[] = [];

    for (const entity of this.enemy.room.entities) {
      if (entity !== this.enemy) {
        disablePositions.push({ x: entity.x, y: entity.y });
      }
    }

    for (let xx = this.enemy.x - 1; xx <= this.enemy.x + 1; xx++) {
      for (let yy = this.enemy.y - 1; yy <= this.enemy.y + 1; yy++) {
        if (
          this.enemy.room.roomArray[xx]?.[yy] instanceof SpikeTrap &&
          (this.enemy.room.roomArray[xx][yy] as SpikeTrap).on
        ) {
          disablePositions.push({ x: xx, y: yy });
        }
      }
    }

    return disablePositions;
  }

  private buildGrid(): any[][] {
    const { roomX, roomY, width, height, roomArray } = this.enemy.room;
    const grid: any[][] = [];
    for (let x = 0; x < roomX + width; x++) {
      grid[x] = [];
      for (let y = 0; y < roomY + height; y++) {
        grid[x][y] = roomArray[x]?.[y] ?? false;
      }
    }
    return grid;
  }

  private applyDirectionalAvoidance(disablePositions: astar.Position[]): void {
    const { x, y, direction } = this.enemy;
    if (direction === Direction.LEFT || direction === Direction.RIGHT) {
      disablePositions.push({ x, y: y + 1 }, { x, y: y - 1 });
    } else if (direction === Direction.UP || direction === Direction.DOWN) {
      disablePositions.push({ x: x + 1, y }, { x: x - 1, y });
    }
  }

  private retargetIfBetterPlayerIsCloser(): void {
    const targetOffline = Object.values(
      this.enemy.game.offlinePlayers,
    ).includes(this.enemy.targetPlayer);
    if (!this.enemy.aggro || targetOffline) {
      const p = this.enemy.nearestPlayer();
      if (p !== false) {
        const [distance, player] = p;
        if (
          distance <= 4 &&
          (targetOffline ||
            distance < this.enemy.playerDistance(this.enemy.targetPlayer))
        ) {
          if (player !== this.enemy.targetPlayer) {
            this.enemy.targetPlayer = player;
            this.enemy.facePlayer(player);
            if (
              player === this.enemy.game.players[this.enemy.game.localPlayerID]
            ) {
              this.enemy.alertTicks = 1;
            }
            this.enemy.makeHitWarnings?.();
          }
        }
      }
    }
  }
}
