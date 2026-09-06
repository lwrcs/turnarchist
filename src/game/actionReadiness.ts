import { LevelState } from "../game";
import type { Game } from "../game";

/** Live actions and playback must use the same level-transition boundary. */
export function isActionReady(game: Game): boolean {
  const state = game as any;
  return !game.replayManager?.isFinished() && game.levelState === LevelState.IN_LEVEL &&
    !state.preLevelGenFadeActive && !state.preLevelGenHoldBlack &&
    !state.preLevelGenActionStarted && !game.transitioningLadder;
}
