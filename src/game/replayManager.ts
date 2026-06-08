import { Game, LevelState } from "../game";
import { GameConstants } from "./gameConstants";
import type { GameAction } from "../player/playerAction";

type DivergenceKind = "precondition" | "behavioral";

interface DivergenceRecord {
  step: number;
  kind: DivergenceKind;
  reason: string;
  action: GameAction;
  playerBefore: { x: number; y: number };
  playerAfter: { x: number; y: number };
  turnBefore: number | undefined;
  turnAfter: number | undefined;
  canMoveBefore: boolean | undefined;
  moved: boolean;
}

interface ReplayReport {
  seed: number | undefined;
  totalActions: number;
  divergenceCount: number;
  divergences: DivergenceRecord[];
  finishedAt: string;
}

const COOLDOWN_GATED_ACTIONS = new Set<GameAction["type"]>([
  "Move",
  "Attack",
  "BumpInteract",
  "TileInteract",
  "Wait",
  "CastSpell",
  "FireRanged",
]);

const MAX_COOLDOWN_WAITS = 20;
const LEVEL_TRANSITION_POLL_MS = 50;
const MAX_LEVEL_TRANSITION_WAITS = 400; // ~20s

function isReplayReady(game: Game): boolean {
  const g = game as any;
  return (
    g.levelState === LevelState.IN_LEVEL &&
    !g.preLevelGenFadeActive &&
    !g.preLevelGenHoldBlack &&
    !g.preLevelGenActionStarted &&
    !g.transitioningLadder
  );
}

function validatePrecondition(action: GameAction, player: any): string | null {
  const room = player.getRoom?.();
  if (!room) return null;
  switch (action.type) {
    // Attack has no useful precondition: the recorded targetX/Y is the input/swing tile
    // (which may be adjacent for melee but intermediate for long-reach weapons like spears),
    // and what actually matters is whether weapon.weaponMove() hits anything. That's caught
    // by the behavioral check post-process: a successful attack means the player did NOT move
    // and the turn advanced; a missed attack means the player walked into the empty tile.
    case "BumpInteract": {
      const hasTarget = room.entities.some(
        (e: any) => e.x === action.targetX && e.y === action.targetY && e.interactable,
      );
      if (!hasTarget)
        return `BumpInteract at (${action.targetX},${action.targetY}): no interactable entity`;
      break;
    }
    case "Move": {
      const blockedByEntity = room.entities.some(
        (e: any) =>
          e.x === action.targetX &&
          e.y === action.targetY &&
          !e.dead &&
          e.collidable !== false &&
          !e.pushable,
      );
      if (blockedByEntity)
        return `Move to (${action.targetX},${action.targetY}): blocked by non-pushable entity`;
      break;
    }
  }
  return null;
}

export class ReplayManager {
  private actions: Array<{ t: number; action: GameAction }> = [];
  private startMs = 0;
  private recording = false;
  private replaying = false;
  private seed: number | undefined = undefined;
  private timer: number | null = null;

  beginRecording(seed?: number) {
    this.actions = [];
    this.startMs = Date.now();
    this.recording = true;
    this.replaying = false;
    this.seed = seed;
  }

  serialize(): {
    seed: number;
    startMs: number;
    recording: boolean;
    actions: Array<{ t: number; action: Record<string, unknown> }>;
  } | null {
    if (this.seed === undefined) return null;
    return {
      seed: this.seed,
      startMs: this.startMs,
      recording: this.recording,
      actions: this.actions.map((a) => ({
        t: a.t,
        action: a.action as unknown as Record<string, unknown>,
      })),
    };
  }

  restore(data: {
    seed: number;
    startMs: number;
    recording: boolean;
    actions: Array<{ t: number; action: Record<string, unknown> }>;
  } | undefined | null) {
    if (!data) return;
    this.seed = data.seed;
    this.startMs = data.startMs;
    this.recording = data.recording;
    this.replaying = false;
    this.actions = data.actions.map((a) => ({
      t: a.t,
      action: a.action as unknown as GameAction,
    }));
  }

  getStats() {
    return {
      count: this.actions.length,
      seed: this.seed,
      recording: this.recording,
      replaying: this.replaying,
    };
  }

  isReplaying(): boolean {
    return this.replaying;
  }

  isRecording(): boolean {
    return this.recording;
  }

  clearRecording() {
    this.actions = [];
    this.seed = undefined;
    this.startMs = 0;
    this.recording = false;
    this.replaying = false;
  }

  stopRecording() {
    this.recording = false;
  }

  hasRecordedActions(): boolean {
    return this.actions.length > 0 && this.seed !== undefined;
  }

  cancelReplay() {
    if (!this.replaying) return;
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
    this.replaying = false;
    this.recording = true;
  }

  recordAction(action: GameAction) {
    if (!this.recording || this.replaying) return;
    this.actions.push({ t: Date.now() - this.startMs, action });
  }

  replay(game: Game, stepMs: number = GameConstants.REPLAY_STEP_MS) {
    console.log("[replay] replay() called", { replaying: this.replaying, actions: this.actions.length, seed: this.seed });
    if (this.replaying) return;
    this.replaying = true;
    this.recording = false;
    const actions = this.actions.slice();
    const seed = this.seed;
    if (actions.length === 0 || seed === undefined) {
      game.pushMessage("No actions recorded; replay aborted.");
      this.replaying = false;
      return;
    }
    game.pushMessage(`Replay starting with ${actions.length} actions...`);

    const startPlayback = () => {
      const local = game.players?.[game.localPlayerID];
      console.log("[replay] startPlayback called, player:", !!local, "levelState:", game.levelState);
      if (!local) {
        setTimeout(startPlayback, 16);
        return;
      }
      let i = 0;
      let cooldownWaitsForStep = 0;
      let cooldownWaitStepIndex = -1;
      let levelWaitsForStep = 0;
      let levelWaitStepIndex = -1;
      const divergences: DivergenceRecord[] = [];
      let halted = false;
      const finishReplay = (haltedAtStep?: number) => {
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = null;
        this.replaying = false;
        this.recording = true;
        const report: ReplayReport = {
          seed,
          totalActions: actions.length,
          divergenceCount: divergences.length,
          divergences,
          finishedAt: new Date().toISOString(),
        };
        console.log("[replay] report", report);
        (window as any).lastReplayReport = report;
        let msg: string;
        if (haltedAtStep !== undefined) {
          msg = `Replay halted at step ${haltedAtStep} of ${actions.length} — ${divergences.length} divergence(s). See window.lastReplayReport.`;
        } else if (divergences.length > 0) {
          msg = `Replay finished. ${divergences.length} divergence(s) — see window.lastReplayReport.`;
        } else {
          msg = "Replay finished. No divergences.";
        }
        game.pushMessage(msg);
      };
      const step = () => {
        if (halted) return;
        if (i >= actions.length) {
          finishReplay();
          return;
        }
        try {
          const action = actions[i].action;

          if (!isReplayReady(game)) {
            if (levelWaitStepIndex !== i) {
              levelWaitStepIndex = i;
              levelWaitsForStep = 0;
            }
            if (levelWaitsForStep < MAX_LEVEL_TRANSITION_WAITS) {
              levelWaitsForStep++;
              if (this.timer) window.clearTimeout(this.timer);
              this.timer = window.setTimeout(step, LEVEL_TRANSITION_POLL_MS);
              return;
            }
            console.warn(
              `[replay] step ${i + 1}: level transition did not complete after ${MAX_LEVEL_TRANSITION_WAITS} polls; proceeding anyway`,
            );
          }

          const beforeX = local.x;
          const beforeY = local.y;
          let canMoveNow: boolean | undefined = undefined;
          try {
            canMoveNow = (local.movement as any)?.canMove?.();
          } catch {}

          if (
            COOLDOWN_GATED_ACTIONS.has(action.type) &&
            canMoveNow === false
          ) {
            if (cooldownWaitStepIndex !== i) {
              cooldownWaitStepIndex = i;
              cooldownWaitsForStep = 0;
            }
            if (cooldownWaitsForStep < MAX_COOLDOWN_WAITS) {
              cooldownWaitsForStep++;
              if (this.timer) window.clearTimeout(this.timer);
              this.timer = window.setTimeout(
                step,
                GameConstants.MOVEMENT_COOLDOWN + 5,
              );
              return;
            }
            console.warn(
              `[replay] step ${i + 1}: exceeded ${MAX_COOLDOWN_WAITS} cooldown waits; proceeding anyway`,
            );
          }

          const roomBefore = (local as any).getRoom?.();
          const turnBefore = roomBefore?.turn;
          const turnCountBefore = (local as any).turnCount;
          console.log("[replay] step begin", {
            index: i + 1,
            total: actions.length,
            type: action.type,
            before: { x: beforeX, y: beforeY },
            turn: turnBefore,
            turnCount: turnCountBefore,
            canMove: canMoveNow,
          });

          const warning = validatePrecondition(action, local);
          if (warning) {
            console.warn(`[replay] divergence at step ${i + 1}: ${warning}`);
            divergences.push({
              step: i + 1,
              action,
              playerBefore: { x: beforeX, y: beforeY },
              playerAfter: { x: beforeX, y: beforeY },
              turnBefore,
              turnAfter: turnBefore,
              canMoveBefore: canMoveNow,
              moved: false,
              kind: "precondition",
              reason: warning,
            });
            halted = true;
            finishReplay(i + 1);
            return;
          }

          // Snapshot pushable presence before process() — roomBefore and roomAfter reference
          // the same object (mutated in place), so we must read this before the action runs.
          const targetHadPushable =
            action.type === "Move" &&
            roomBefore?.entities?.some(
              (e: any) =>
                e.x === action.targetX &&
                e.y === action.targetY &&
                !e.dead &&
                (e as any).pushable === true,
            ) === true;

          local.menu.open = false;
          local.dead = false;
          local.inventory.close();
          local.actionProcessor.process(action);
          const afterX = local.x;
          const afterY = local.y;
          const moved = beforeX !== afterX || beforeY !== afterY;
          const roomAfter = (local as any).getRoom?.();
          const turnAfter = roomAfter?.turn;
          const turnCountAfter = (local as any).turnCount;
          const turnCountAdvanced =
            typeof turnCountBefore === "number" &&
            typeof turnCountAfter === "number" &&
            turnCountAfter > turnCountBefore;
          // A turn was consumed if EITHER the player's turn counter incremented
          // (the cleanest signal: monotonic, set in finishTick) OR the room flipped
          // into computerTurn (set by room.tick before the computer turn runs).
          const turnAdvanced =
            turnCountAdvanced ||
            (typeof turnBefore === "number" &&
              typeof turnAfter === "number" &&
              turnAfter !== turnBefore);
          console.log("[replay] step end", {
            index: i + 1,
            type: action.type,
            after: { x: afterX, y: afterY },
            moved,
            turnAdvanced,
            turnCountDelta:
              typeof turnCountAfter === "number" &&
              typeof turnCountBefore === "number"
                ? turnCountAfter - turnCountBefore
                : undefined,
          });

          let behavioralReason: string | null = null;
          switch (action.type) {
            case "Move": {
              if (afterX !== action.targetX || afterY !== action.targetY) {
                // Push outcomes (chain-push, crush, blocked chain) are too complex to
                // predict reliably — accept any result when a pushable was at the target.
                if (targetHadPushable) break;
                // Some failed Move recordings are NOT divergences — both recording
                // and replay produced the same "did not move" outcome for legit reasons:
                //   - Wall-bumps: target tile is solid.
                //   - Blocked by any entity (alive or dead, any kind): a crab corpse
                //     hasn't been cleaned up yet, a pushable that can't be pushed,
                //     an interactable that returned early, etc. Precondition already
                //     catches the alive non-pushable case explicitly.
                const targetTile = roomAfter?.roomArray?.[action.targetX]?.[action.targetY];
                const targetIsSolid = targetTile?.isSolid?.() === true;
                const entityAtTarget = roomAfter?.entities?.some(
                  (e: any) =>
                    e.x === action.targetX && e.y === action.targetY,
                );
                if (!targetIsSolid && !entityAtTarget) {
                  behavioralReason = `Move did not reach target tile (${action.targetX},${action.targetY}); ended at (${afterX},${afterY})`;
                }
              }
              break;
            }
            case "Attack": {
              // A successful attack: weapon.weaponMove() hit a target, returned false,
              // tryMove bailed → player stayed put AND the attack ticked the room.
              // Two failure modes:
              //   1. Player moved → the swing tile was empty, tryMove walked into it.
              //   2. Player didn't move and the turn didn't advance → swing was blocked
              //      by a wall and nothing was hit.
              if (moved) {
                behavioralReason = `Attack at (${action.targetX},${action.targetY}) missed: player moved to (${afterX},${afterY}) instead of attacking`;
              } else if (!turnAdvanced) {
                behavioralReason = `Attack at (${action.targetX},${action.targetY}) had no effect (player did not move, turn did not advance)`;
              }
              break;
            }
            case "BumpInteract": {
              // BumpInteract outcomes vary by entity:
              //   - Vending machine: opens UI, does NOT advance a turn.
              //   - Locked door: shake/unlock, may not advance a turn.
              //   - Some interactables: tick the room.
              // The only reliable failure signal is: did the player walk into the tile?
              // If the player stayed put, the interactable absorbed the bump (success).
              // If the player moved, the interactable wasn't there (target drifted).
              if (moved) {
                behavioralReason = `BumpInteract at (${action.targetX},${action.targetY}) missed: player moved to (${afterX},${afterY}) instead of interacting`;
              }
              break;
            }
          }
          if (behavioralReason) {
            console.warn(`[replay] behavioral divergence at step ${i + 1}: ${behavioralReason}`);
            divergences.push({
              step: i + 1,
              action,
              playerBefore: { x: beforeX, y: beforeY },
              playerAfter: { x: afterX, y: afterY },
              turnBefore,
              turnAfter,
              canMoveBefore: canMoveNow,
              moved,
              kind: "behavioral",
              reason: behavioralReason,
            });
            halted = true;
            finishReplay(i + 1);
            return;
          }
        } catch (e) {
          // swallow to avoid interrupting playback
        }
        if (halted) return;
        const minDelay = Math.max(GameConstants.MOVEMENT_COOLDOWN + 5, stepMs);
        let nextDelay = minDelay;
        try {
          const room = (local as any).getRoom?.();
          if (room?.turn === 1) nextDelay += GameConstants.REPLAY_COMPUTER_TURN_DELAY;
        } catch {}
        i++;
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(step, nextDelay);
      };
      step();
    };

    // Always regenerate from seed — level generation is deterministic per-floor
    // (levelGenerator reseeds via seed+depth^pathHash) so this produces identical worlds.
    // The old V1 gameState snapshot path had missing entity codecs and stale RNG state.
    game.newGame(seed);
    // game.newGame calls beginRecording which resets replaying→false and clears actions;
    // re-assert replay state and restore actions so Watch Replay remains available afterwards.
    this.replaying = true;
    this.recording = false;
    this.actions = actions.slice();
    (game as any).started = true;
    (game as any).startedFadeOut = false;
    // Poll until the level is ready (avoids event ordering race with LEVEL_GENERATION_COMPLETED).
    const waitForReady = () => {
      if (!this.replaying) return; // cancelled while waiting
      if (isReplayReady(game)) {
        startPlayback();
      } else {
        console.log("[replay] waiting for level ready, levelState:", game.levelState);
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(waitForReady, LEVEL_TRANSITION_POLL_MS);
      }
    };
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(waitForReady, 0);
  }
}
