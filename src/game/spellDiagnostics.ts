import type { Player } from "../player/player";

const events: Record<string, unknown>[] = [];
let sequence = 0;

/** Bounded, scalar-only trace: diagnostic failures must never affect casting. */
export function traceSpell(player: Player, event: string, details: Record<string, unknown> = {}) {
  try {
    const manager = player.game.replayManager;
    const room = player.getRoom();
    const weapon = player.inventory?.weapon;
    const entry = {
      sequence: ++sequence, at: Date.now(), event,
      mode: manager.isReplaying() ? "replay" : "live",
      seed: manager.getStats().seed,
      step: manager.isReplaying() ? manager.diagnosticStep : manager.getStats().count + 1,
      roomId: room?.id, depth: room?.depth, roomTurn: room?.turn,
      turnCount: player.turnCount, x: player.x, y: player.y,
      health: player.health, dead: player.dead, busyAnimating: player.busyAnimating,
      equippedWeapon: weapon?.constructor.name,
      ...details,
    };
    events.push(entry);
    // Keep separate budgets so playback cannot evict the live cast evidence.
    const sameMode = events.filter(e => e.mode === entry.mode);
    if (sameMode.length > 300) events.splice(events.indexOf(sameMode[0]), 1);
    console.log("[spell] " + JSON.stringify(entry));
    return entry.sequence;
  } catch { return undefined; }
}

export function getSpellDiagnostics() {
  return events.map(event => ({ ...event }));
}
