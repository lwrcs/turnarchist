import { Player } from "./player";
import type { GameAction } from "./playerAction";
import { applyIronSmithRecipe } from "../item/resource/ironBar";
import { DownLadder } from "../tile/downLadder";

export class PlayerActionProcessor {
  private player: Player;

  constructor(player: Player) {
    this.player = player;
  }

  // Snapshot game state for the per-action outcome that the replay validator
  // compares. Captured AFTER the action's effects.
  //
  // Why turnCount/roomTurn only for Directional: those fields depend on whether
  // the previous turn's `room.update` has fired `computerTurn()` yet — purely a
  // function of wall-clock timing between actions. During recording the player
  // may act faster than the 250ms `COMPUTER_TURN_DELAY`; during replay the 165ms
  // step interval easily exceeds the 30ms `REPLAY_COMPUTER_TURN_DELAY`. So the
  // same action processed at the same logical point can capture different
  // turnCount/roomTurn values even when the game state has not actually diverged.
  // Directional actions are immune because `tryMove → catchUp` synchronously
  // resolves the pending computer turn before the outcome is captured. For every
  // other action type, we omit those timing-dependent fields and let any real
  // divergence surface at the next Directional action's outcome (where catchUp
  // will have normalized the state).
  private captureOutcome(includeTurnState: boolean) {
    const out: any = {
      playerX: this.player.x,
      playerY: this.player.y,
    };
    if (includeTurnState) {
      // turnCount, roomTurn, and playerHealth all depend on whether the previous
      // turn's computerTurn has fired — which is timing-dependent for non-Directional
      // actions. Only include them when we're capturing after a tryMove → catchUp
      // path, which deterministically resolves any pending computer turn.
      const room = (this.player as any).getRoom?.();
      out.turnCount = this.player.turnCount;
      out.roomTurn = room?.turn;
      out.playerHealth = this.player.health;
    }
    return out;
  }

  private record(action: GameAction, includeTurnState: boolean = false) {
    try {
      (this.player.game as any).replayManager?.recordAction(
        action,
        this.captureOutcome(includeTurnState),
      );
    } catch {}
  }

  process(action: GameAction) {
    switch (action.type) {
      // --- Directional world action ---
      // One action type covers walk/attack/push/interact/door-unlock. The executor
      // determines what actually happens. Recording only happens if movement.move()
      // returns productive (tryMove mutated state and was not silently dropped by
      // cooldown/queue/guards). The outcome is recorded so replay can validate state
      // consistency directly, without relying on action-type labels.
      case "Directional": {
        // Outcome must be captured AT actual execution time, not at input time. A move
        // that gets queued (canMove=false at input) doesn't execute until the queue
        // handler dequeues it 50ms+ later — by which point catchUp has run the previous
        // computer turn and the move itself has ticked the room. Capturing at input time
        // misses both, producing an outcome that won't match replay (which executes
        // immediately because the inter-step delay > MOVEMENT_COOLDOWN).
        //
        // The callback fires inside movement.move once tryMove succeeds, whether that's
        // immediate or via the queue. We also re-record the action with the actually-
        // executed target so replay sees the same target the game saw at execution time.
        this.player.movement.move(
          action.direction,
          action.targetX,
          action.targetY,
          (actualX, actualY) => {
            const executed =
              actualX === action.targetX && actualY === action.targetY
                ? action
                : { ...action, targetX: actualX, targetY: actualY };
            // Directional outcomes include turnCount/roomTurn — tryMove's catchUp
            // synchronously resolves any pending computer turn, so the snapshot is
            // deterministic relative to action ordering, not wall-clock timing.
            this.record(executed, true);
          },
        );
        break;
      }

      case "Wait":
        try {
          (this.player as any).getRoom?.()?.tick?.(this.player);
        } catch {}
        this.record(action);
        break;

      // --- Ranged / spell ---
      case "CastSpell":
      case "FireRanged": {
        const rt = this.player.rangedTargeting;
        if (rt) {
          if (!rt.active) {
            // During replay the targeting UI isn't running — start it with the equipped weapon.
            const weapon = this.player.inventory?.weapon;
            if (weapon && typeof (weapon as any).fireAtTarget === "function") {
              rt.start(weapon as any);
            }
          }
          rt.targetX = action.targetX;
          rt.targetY = action.targetY;
          rt.fire();
        }
        // Note: spells defer room.tick to the SpellBeam onComplete callback (~245ms
        // later via render loop). The outcome captured here is BEFORE that deferred
        // tick fires — but it's identical between recording and replay because both
        // capture at the same synchronous point. The deferred tick's effect surfaces
        // in the NEXT action's outcome via catchUp, so any divergence there gets caught.
        this.record(action);
        break;
      }

      // --- Inventory (slot-direct, cursor-independent) ---
      case "UseItem":
        this.player.inventory.itemUseAt(action.slotIndex);
        this.record(action);
        break;

      case "UseItemOn":
        this.player.inventory.itemUseOnAt(action.fromSlot, action.toSlot);
        this.record(action);
        break;

      case "DropItem":
        this.player.inventory.dropItemAt(action.slotIndex);
        this.record(action);
        break;

      case "MoveItem":
        this.player.inventory.swapSlots(action.fromSlot, action.toSlot);
        this.record(action);
        break;

      case "VendingMachineBuy":
        this.player.openVendingMachine?.space();
        this.record(action);
        break;

      case "Restart":
        // Don't capture outcome here — restart resets game state, which makes a
        // before/after comparison meaningless and produces a noisy fingerprint
        // that will always mismatch in replay if the seed advances.
        try { (this.player.game as any).replayManager?.recordAction(action); } catch {}
        this.player.restart();
        break;

      case "AutoPickup": {
        // Legacy path: kept only so older recordings that have AutoPickup actions
        // (from the deprecated wall-clock chest-reveal timer) still replay
        // approximately. New recordings never emit AutoPickup — chest autopickup is
        // now performed synchronously inside the Directional action that opened the
        // chest, so it's captured as part of that action's outcome.
        try {
          const room = (this.player as any).getRoom?.();
          if (!room) break;
          const item = room.items?.find?.(
            (i: any) =>
              i.x === action.itemX && i.y === action.itemY && i.name === action.itemKind,
          );
          if (item) {
            (item as any).inChest = false;
            item.onPickup(this.player);
          }
        } catch {}
        break;
      }

      case "SmithRecipe": {
        // Selection-menu choice from ironBar.smith. The actual crafting is delegated
        // to applyIronSmithRecipe so the same code path runs at record-time (when
        // the player clicks an option) and at replay-time (when this action fires).
        applyIronSmithRecipe(this.player, action.recipe);
        this.record(action);
        break;
      }

      case "LadderConfirm": {
        // Replay-side: the player just walked onto a downLadder during the prior
        // Directional action, which opened the screenMessage. Reproduce the
        // Travel/Descend click by closing the message and triggering descent.
        try {
          const room = (this.player as any).getRoom?.();
          const tile = room?.roomArray?.[this.player.x]?.[this.player.y];
          if (tile instanceof DownLadder) {
            tile.confirmDescent(this.player);
          } else {
            // Defensive: still close the message so subsequent actions aren't
            // absorbed by a stale modal.
            this.player.screenMessage.close();
          }
        } catch {}
        this.record(action);
        break;
      }

      case "LadderCancel": {
        this.player.screenMessage.close();
        this.record(action);
        break;
      }

      case "Command": {
        // Re-execute the chat command. The skipRecord flag prevents commandHandler
        // from re-routing through the action processor and creating a recursion.
        console.log("[command] processor executing:", action.command);
        try {
          (this.player.game as any).commandHandler?.(action.command, /* skipRecord */ true);
        } catch (err) {
          console.error("[command] processor threw:", err);
        }
        this.record(action);
        break;
      }
    }
  }
}
