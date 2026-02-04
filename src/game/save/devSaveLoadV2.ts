import { Game } from "../../game";
import type { Result } from "./errors";
import { err, ok } from "./errors";
import { createSaveV2 } from "./writeV2";
import { parseSaveV2Json } from "./validate";
import { loadSaveV2 } from "./loadV2";

/**
 * Dev helper: save from one Game instance and load into another.
 * This avoids mutating the source instance while testing load logic.
 */
export const devSaveAndLoadV2 = async (
  source: Game,
  target: Game,
): Promise<Result<void>> => {
  const saved = createSaveV2(source);
  if (saved.ok === false) return err(saved.error);
  const raw = JSON.stringify(saved.value);
  const parsed = parseSaveV2Json(raw);
  if (parsed.ok === false) return err(parsed.error);
  return await loadSaveV2(target, parsed.value);
};


