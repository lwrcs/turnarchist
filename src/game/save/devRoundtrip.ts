import { Game } from "../../game";
import type { Result } from "./errors";
import { err, ok } from "./errors";
import { parseSaveV2Json } from "./validate";
import { createSaveV2 } from "./writeV2";

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


