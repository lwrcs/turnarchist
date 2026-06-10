import { Game, LevelState } from "../game";
import { GameConstants } from "./gameConstants";
import { GameplaySettings } from "./gameplaySettings";
import type { GameAction } from "../player/playerAction";

type DivergenceKind = "behavioral";

interface ActionOutcome {
  playerX: number;
  playerY: number;
  // turnCount, roomTurn, playerHealth are captured only for actions that go through
  // tryMove → catchUp (currently Directional). For other action types (UseItem,
  // DropItem, CastSpell, etc.) these are wall-clock-timing-dependent — recording
  // and replay can capture different values even when game state has not actually
  // diverged. Omitting them avoids false-positive divergence reports; any real
  // state divergence will surface at the next Directional action's outcome.
  turnCount?: number;
  roomTurn?: number;
  playerHealth?: number;
}

interface RecordedAction {
  t: number;
  action: GameAction;
  // Post-action snapshot captured during recording. Replay compares against this
  // for true state-fidelity validation (instead of guessing from action.type).
  outcome?: ActionOutcome;
}

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
  expectedOutcome?: ActionOutcome;
  actualOutcome?: ActionOutcome;
}

interface ReplayReport {
  seed: number | undefined;
  totalActions: number;
  divergenceCount: number;
  divergences: DivergenceRecord[];
  finishedAt: string;
}

const COOLDOWN_GATED_ACTIONS = new Set<GameAction["type"]>([
  "Directional",
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

export class ReplayManager {
  private actions: RecordedAction[] = [];
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
    actions: Array<{ t: number; action: Record<string, unknown>; outcome?: ActionOutcome }>;
  } | null {
    if (this.seed === undefined) return null;
    return {
      seed: this.seed,
      startMs: this.startMs,
      recording: this.recording,
      actions: this.actions.map((a) => ({
        t: a.t,
        action: a.action as unknown as Record<string, unknown>,
        outcome: a.outcome,
      })),
    };
  }

  restore(data: {
    seed: number;
    startMs: number;
    recording: boolean;
    actions: Array<{ t: number; action: Record<string, unknown>; outcome?: ActionOutcome }>;
  } | undefined | null) {
    if (!data) return;
    this.seed = data.seed;
    this.startMs = data.startMs;
    this.recording = data.recording;
    this.replaying = false;
    this.actions = data.actions.map((a) => ({
      t: a.t,
      action: a.action as unknown as GameAction,
      outcome: a.outcome,
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

  recordAction(action: GameAction, outcome?: ActionOutcome) {
    if (!this.recording || this.replaying) return;
    this.actions.push({ t: Date.now() - this.startMs, action, outcome });
  }

  replay(
    game: Game,
    stepMs: number = GameplaySettings.FAST_REPLAYS
      ? GameConstants.REPLAY_STEP_MS_FAST
      : GameConstants.REPLAY_STEP_MS,
  ) {
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
          console.log("[replay] step end", {
            index: i + 1,
            type: action.type,
            after: { x: afterX, y: afterY },
            moved,
            turnCountDelta:
              typeof turnCountAfter === "number" &&
              typeof turnCountBefore === "number"
                ? turnCountAfter - turnCountBefore
                : undefined,
          });

          // State-fidelity check: if the recording captured a post-action snapshot
          // (player position + turn count + room.turn + health after this action),
          // compare it to the replay's state. Any mismatch is a real divergence —
          // game state actually diverged between recording and replay, regardless
          // of what label the action carries. Old recordings without an `outcome`
          // field skip this check and replay without behavioral validation.
          //
          // Why roomTurn matters: an action that ticks the room in recording but
          // not in replay (or vice versa) produces identical player position + turn
          // count at outcome time — the cascade only surfaces a step later when the
          // catch-up runs differently. Comparing roomTurn catches the divergence at
          // the originating step.
          const expectedOutcome = actions[i].outcome;
          if (expectedOutcome) {
            // Build the actual snapshot to match the shape of the expected outcome.
            // Fields the recording omitted (e.g. turnCount for non-Directional actions)
            // are skipped here too so the comparison naturally ignores them.
            const actualOutcome: ActionOutcome = {
              playerX: afterX,
              playerY: afterY,
            };
            if (expectedOutcome.turnCount !== undefined) actualOutcome.turnCount = turnCountAfter;
            if (expectedOutcome.roomTurn !== undefined) actualOutcome.roomTurn = roomAfter?.turn;
            if (expectedOutcome.playerHealth !== undefined) actualOutcome.playerHealth = (local as any).health;
            const mismatches: string[] = [];
            if (
              expectedOutcome.playerX !== actualOutcome.playerX ||
              expectedOutcome.playerY !== actualOutcome.playerY
            ) {
              mismatches.push(
                `player=(${expectedOutcome.playerX},${expectedOutcome.playerY})→(${actualOutcome.playerX},${actualOutcome.playerY})`,
              );
            }
            if (
              expectedOutcome.turnCount !== undefined &&
              expectedOutcome.turnCount !== actualOutcome.turnCount
            ) {
              mismatches.push(`turnCount=${expectedOutcome.turnCount}→${actualOutcome.turnCount}`);
            }
            if (
              expectedOutcome.roomTurn !== undefined &&
              expectedOutcome.roomTurn !== actualOutcome.roomTurn
            ) {
              mismatches.push(`roomTurn=${expectedOutcome.roomTurn}→${actualOutcome.roomTurn}`);
            }
            if (
              expectedOutcome.playerHealth !== undefined &&
              expectedOutcome.playerHealth !== actualOutcome.playerHealth
            ) {
              mismatches.push(
                `playerHealth=${expectedOutcome.playerHealth}→${actualOutcome.playerHealth}`,
              );
            }
            if (mismatches.length > 0) {
              const reason = `State divergence at step ${i + 1}: ${mismatches.join(", ")}`;
              console.warn(`[replay] ${reason}`);
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
                reason,
                expectedOutcome,
                actualOutcome,
              });
              halted = true;
              finishReplay(i + 1);
              return;
            }
          }
        } catch (e) {
          // swallow to avoid interrupting playback
        }
        if (halted) return;
        const minDelay = Math.max(GameConstants.MOVEMENT_COOLDOWN + 5, stepMs);
        let nextDelay = minDelay;
        try {
          const room = (local as any).getRoom?.();
          if (room?.turn === 1) {
            nextDelay += GameplaySettings.FAST_REPLAYS
              ? GameConstants.REPLAY_COMPUTER_TURN_DELAY_FAST
              : GameConstants.REPLAY_COMPUTER_TURN_DELAY;
          }
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
