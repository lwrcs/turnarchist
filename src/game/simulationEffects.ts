import type { Game } from "../game";

/** Shared by the browser frame loop and a future headless simulation driver. */
export function advanceSimulationEffects(game: Game, delta: number): void {
  if (!Number.isFinite(delta) || delta < 0) throw new Error("Invalid simulation delta");
  if (game.replayManager.isFinished()) return;
  const rooms = new Set(Object.values(game.players).map(player => player.getRoom()));
  // Snapshot before executing callbacks: effects spawned by an arrival begin next frame.
  const effects = Array.from(rooms).flatMap(room => room ? [...room.projectiles] : []);
  for (const effect of effects) {
    if (effect && !effect.dead) effect.advanceSimulation(delta);
  }
}
