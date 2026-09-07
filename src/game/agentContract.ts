import { GameConstants } from "./gameConstants";
import { GameplaySettings } from "./gameplaySettings";

// Webpack supplies the compilation hash, including uncommitted bundled code.
declare const __webpack_hash__: string;

export function getAgentContract() {
  return {
    observationSchemaVersion: 4,
    actionSchemaVersion: 2,
    observationMode: "diagnostic-current-room",
    gameVersion: GameConstants.VERSION,
    buildId: typeof __webpack_hash__ === "string" ? __webpack_hash__ : null,
    // Detect changes to exposed runtime settings even without rebuilding the bundle.
    settingsId: JSON.stringify(Object.entries({ ...GameplaySettings,
      developerMode: GameConstants.DEVELOPER_MODE,
      animationSpeed: GameConstants.ANIMATION_SPEED,
      slowInputsNearEnemies: GameConstants.SLOW_INPUTS_NEAR_ENEMIES,
    }).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)),
  };
}

export type AgentContract = ReturnType<typeof getAgentContract>;

/** Metadata check for future checkpoint loaders. Matching metadata is not a skill test. */
export function checkAgentCompatibility(trainedOn: Partial<AgentContract> | null) {
  const current = getAgentContract();
  const schemaCompatible = !!trainedOn &&
    trainedOn.observationSchemaVersion === current.observationSchemaVersion &&
    trainedOn.actionSchemaVersion === current.actionSchemaVersion &&
    trainedOn.observationMode === current.observationMode;
  const sameBuild = !!current.buildId && trainedOn?.buildId === current.buildId;
  const sameSettings = trainedOn?.settingsId === current.settingsId;
  return { schemaCompatible, sameBuild, sameSettings,
    requiresEvaluation: !schemaCompatible || !sameBuild || !sameSettings,
    current };
}
