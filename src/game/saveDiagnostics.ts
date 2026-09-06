import type { Game } from "../game";

/** Capture only game diagnostics, never the full save or player/account identifiers. */
export function traceSaveState(game: Game, event: string, save?: any) {
  try {
    const player = game.players?.[game.localPlayerID];
    const inv = player?.inventory;
    const replay = game.replayManager?.serialize();
    const summarizeReplay = (data: any) => data && ({
      seed: data.seed, recording: data.recording, startMs: data.startMs,
      count: data.actions?.length, tail: data.actions?.slice(-8),
    });
    const describe = (item: any, slot: number) => item && ({
      slot, type: item.constructor?.name, name: item.name,
      equipped: item.equipped, broken: item.broken, durability: item.durability,
      cooldown: item.cooldown, cooldownMax: item.cooldownMax,
      spells: item.spells?.map((spell: any) => ({id: spell.id, type: spell.constructor?.name})),
      activeSpell: item.activeSpell?.id, pendingSpell: item.pendingSpell?.id,
    });
    const targeting = player?.rangedTargeting;
    const room = player?.getRoom();
    const savedPlayers = save?.delta?.players ?? save?.players;
    const entry = {
      event, at: Date.now(), saveVersion: save?.saveVersion ?? (save ? 1 : undefined),
      savedAt: save?.meta?.savedAtMs, seed: game.levelgen?.seed,
      player: player && {x: player.x, y: player.y, health: player.health,
        dead: player.dead, turnCount: player.turnCount, roomId: room?.id, depth: room?.depth},
      inventory: inv?.items.map(describe),
      equippedSlot: inv?.items.indexOf(inv.weapon),
      targeting: targeting && {active: targeting.active, x: targeting.targetX, y: targeting.targetY,
        sourceSlot: inv?.items.indexOf(targeting.getWeapon() as any),
        source: describe(targeting.getWeapon(), -1)},
      replay: summarizeReplay(replay), savedReplay: summarizeReplay(save?.replay),
      savedInventories: savedPlayers && Object.values(savedPlayers).map((p: any) => p.inventory),
    };
    (window as any).publishSaveDiagnostic?.(entry);
    console.log("[save-diagnostic] " + JSON.stringify(entry));
  } catch (error) {
    console.warn("[save-diagnostic] capture failed", String(error));
  }
}
