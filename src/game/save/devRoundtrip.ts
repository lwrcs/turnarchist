import { Game } from "../../game";
import type { Result } from "./errors";
import { err, ok } from "./errors";
import { parseSaveV2Json } from "./validate";
import { createSaveV2 } from "./writeV2";
import { captureFingerprint } from "./fingerprint";
import {
  validateRoundtrip,
  formatReport,
  type RoundtripReport,
} from "./roundtripValidator";

/**
 * Dev-only helper: create a SaveV2, stringify, then validate parse.
 * This catches schema drift early while we iterate.
 */
export const devCreateAndValidateSaveV2 = (game: Game): Result<void> => {
  const saveR = createSaveV2(game);
  if (saveR.ok === false) return err(saveR.error);
  const raw = JSON.stringify(saveR.value);
  const parsed = parseSaveV2Json(raw);
  if (parsed.ok === false) return err(parsed.error);
  return ok(undefined);
};

/**
 * Dev-only helper: full roundtrip with fingerprint diff.
 * Captures fingerprint → saves → loads into fresh Game → captures fingerprint → diffs.
 * Logs a full report to the console.
 */
export const devRoundtripWithReport = async (
  game: Game,
): Promise<RoundtripReport> => {
  console.log("[devRoundtrip] Starting roundtrip validation...");
  const report = await validateRoundtrip(game);
  console.log(formatReport(report));
  return report;
};

/**
 * Dev-only helper: capture and return current game fingerprint.
 */
export const devCaptureFingerprint = (game: Game) => {
  return captureFingerprint(game);
};
