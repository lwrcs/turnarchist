import { Room } from "../room/room";
import type { Entity } from "../entity/entity";

export interface PushChainResult {
  chain: Entity[];
  nextX: number;
  nextY: number;
  enemyEnd: boolean;
}

export function computePushChain(
  room: Room,
  start: Entity,
  dx: number,
  dy: number,
): PushChainResult {
  let nextX = start.x + dx;
  let nextY = start.y + dy;
  let enemyEnd = false;
  const chain: Entity[] = [];

  while (true) {
    let foundEnd = true;
    for (const f of room.entities) {
      f.lastX = f.x;
      f.lastY = f.y;
      if (f.pointIn(nextX, nextY)) {
        if (!f.chainPushable) {
          enemyEnd = true;
          foundEnd = true;
          break;
        }
        foundEnd = false;
        chain.push(f as Entity);
        break;
      }
    }
    if (foundEnd) break;
    const tail = chain[chain.length - 1];
    nextX += dx * tail.w;
    nextY += dy * tail.h;
  }

  return { chain, nextX, nextY, enemyEnd };
}

export function applyPushChain(
  room: Room,
  start: Entity,
  chain: Entity[],
  dx: number,
  dy: number,
  nextX: number,
  nextY: number,
  enemyEnd: boolean,
): boolean {
  const behindTile = room.roomArray?.[nextX]?.[nextY];
  const canCrush = (behindTile && behindTile.canCrushEnemy?.()) || enemyEnd;
  const tailToCrush = canCrush && chain.length > 0 ? chain[chain.length - 1] : null;

  // If there is no chain and the next tile would crush or is blocked by a non-chainPushable,
  // crush the starting entity instead of moving it (mirrors player push behavior)
  if (chain.length === 0 && canCrush) {
    start.crush(dx, dy);
    return false;
  }

  for (const f of chain) {
    f.lastX = f.x;
    f.lastY = f.y;
    // If this is the one that will be crushed, don't animate a push onto the blocker first.
    // `crush()` will snap it into the blocking tile and drive the visual via crush anim.
    if (f === tailToCrush) continue;
    f.x += dx;
    f.y += dy;
    f.drawX = dx;
    f.drawY = dy;
    f.skipNextTurns = 1; // ensure the pushed ones skip next turn, like player push
    f.markPushedMove();
  }

  if (canCrush && chain.length > 0) {
    const tail = chain[chain.length - 1];
    tail.crush(dx, dy);
  }

  start.lastX = start.x;
  start.lastY = start.y;
  start.x += dx;
  start.y += dy;
  start.drawX = dx;
  start.drawY = dy;
  // Mark the head as pushed too so its animation speed matches the chain.
  start.skipNextTurns = 1;
  start.markPushedMove();
  return true;
}
