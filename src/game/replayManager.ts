import { Game, LevelState } from "../game";
import { GameConstants } from "./gameConstants";
import { PlayerAction } from "../player/playerAction";
import { globalEventBus } from "../event/eventBus";
import { EVENTS } from "../event/events";
import { createGameState, loadGameState, GameState } from "./gameState";
import { Random } from "../utility/random";

export class ReplayManager {
  private actions: Array<{ t: number; action: PlayerAction }> = [];
  private startMs = 0;
  private recording = false;
  private replaying = false;
  private seed: number | undefined = undefined;
  private timer: number | null = null;
  private baseState: GameState | null = null;

  beginRecording(seed?: number, game?: Game) {
    this.actions = [];
    this.startMs = Date.now();
    this.recording = true;
    this.replaying = false;
    this.seed = seed;
    if (game) {
      // Capture after the game is actually ready (entered level and player exists)
      const tryCapture = () => {
        try {
          const local = game.players?.[game.localPlayerID];
          const ready =
            !!local &&
            !!game.room &&
            game.levelState === LevelState.IN_LEVEL &&
            Array.isArray(game.rooms) &&
            game.rooms.length > 0;
          if (ready) {
            if (!this.baseState) this.baseState = createGameState(game);
            return; // stop polling
          }
        } catch {}
        setTimeout(tryCapture, 16);
      };
      setTimeout(tryCapture, 0);
    }
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

  recordAction(action: PlayerAction) {
    if (!this.recording || this.replaying) return;
    this.actions.push({ t: Date.now() - this.startMs, action });
  }

  replay(game: Game, stepMs: number = GameConstants.REPLAY_STEP_MS) {
    if (this.replaying) return;
    this.replaying = true;
    this.recording = false;
    // Snapshot actions and seed before restarting the game
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
      if (!local) {
        // Try again next frame until player is ready
        setTimeout(startPlayback, 16);
        return;
      }
      // Do not mark the player as busy; that suppresses movement and actions
      let i = 0;
      const step = () => {
        if (i >= actions.length) {
          this.replaying = false;
          this.recording = false;
          game.pushMessage("Replay finished.");
          return;
        }
        try {
          const action = actions[i].action;
          const beforeX = local.x;
          const beforeY = local.y;
          let canMoveNow: boolean | undefined = undefined;
          try {
            canMoveNow = (local.movement as any)?.canMove?.();
          } catch {}
          const room = (local as any).getRoom?.();
          const turn = room?.turn;
          console.log("[replay] step begin", {
            index: i + 1,
            total: actions.length,
            type: action.type,
            before: { x: beforeX, y: beforeY },
            turn,
            canMove: canMoveNow,
          });
          local.menu.open = false;
          local.dead = false;
          local.inventory.close();
          local.actionProcessor.process(action);
          const afterX = local.x;
          const afterY = local.y;
          const moved = beforeX !== afterX || beforeY !== afterY;
          console.log("[replay] step end", {
            index: i + 1,
            type: action.type,
            after: { x: afterX, y: afterY },
            moved,
          });
        } catch (e) {
          // Swallow errors during replay to avoid interrupting
        }
        // Compute delay to next action using recorded timestamps
        const minDelay = Math.max(GameConstants.MOVEMENT_COOLDOWN + 5, stepMs);

        const recordedDelay = minDelay;
        i < actions.length - 1
          ? Math.max(1, actions[i + 1].t - actions[i].t)
          : stepMs;
        let nextDelay = Math.max(recordedDelay, minDelay);
        // If computer turn is active, wait extra to allow it to complete
        try {
          const room = (local as any).getRoom?.();
          if (room && room.turn !== undefined) {
            // TurnState.computerTurn is 1 in current enum ordering
            const isComputerTurn = room.turn === 1;
            if (isComputerTurn)
              nextDelay += GameConstants.REPLAY_COMPUTER_TURN_DELAY;
          }
        } catch {}
        console.log("[replay] schedule next", {
          index: i + 1,
          recordedDelay,
          minDelay,
          nextDelay,
        });
        i++;
        if (this.timer) window.clearTimeout(this.timer);
        this.timer = window.setTimeout(step, nextDelay);
      };
      step();
    };
    // Restore to captured base state instead of starting a new run
    if (this.baseState) {
      try {
        const snapshot = JSON.parse(JSON.stringify(this.baseState));
        const activeUsernames = Object.keys(game.players);
        loadGameState(game, activeUsernames, snapshot, false)
          .then(() => {
            (game as any).started = true;
            (game as any).startedFadeOut = false;
            this.recording = false;
            try {
              console.log("[replay] seed/state after load", {
                seed: (game as any).levelgen?.seed,
                expectedSeed: snapshot.seed,
                randomState: (Random as any).state,
                expectedRandom: snapshot.randomState,
              });
            } catch {}
            startPlayback();
          })
          .catch(() => {
            // Fallback to seed restart on failure
            game.newGame(seed);
            (game as any).started = true;
            (game as any).startedFadeOut = false;
            this.recording = false;
            const onReady = () => {
              if (game.levelState !== LevelState.IN_LEVEL) return;
              globalEventBus.off(
                EVENTS.LEVEL_GENERATION_COMPLETED,
                onReady as any,
              );
              startPlayback();
            };
            globalEventBus.on(EVENTS.LEVEL_GENERATION_COMPLETED, onReady);
            setTimeout(onReady, 0);
          });
        return; // handled via promise
      } catch {}
    }
    // No base snapshot: use seed restart and wait for generation
    game.newGame(seed);
    (game as any).started = true;
    (game as any).startedFadeOut = false;
    this.recording = false;
    const onReady = () => {
      if (game.levelState !== LevelState.IN_LEVEL) return;
      globalEventBus.off(EVENTS.LEVEL_GENERATION_COMPLETED, onReady as any);
      startPlayback();
    };
    globalEventBus.on(EVENTS.LEVEL_GENERATION_COMPLETED, onReady);
    setTimeout(onReady, 0);
  }
}
