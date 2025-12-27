import { getCookieChunks, setCookieChunks } from "../utility/cookies";

const COOKIE_PREFIX = "bestiary_seen_enemies_v1";

export const loadSeenEnemyTypes = (): string[] => {
  const raw = getCookieChunks(COOKIE_PREFIX);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
};

export const saveSeenEnemyTypes = (enemyTypes: Iterable<string>) => {
  const uniq = Array.from(new Set(enemyTypes)).sort();
  setCookieChunks(COOKIE_PREFIX, JSON.stringify(uniq), 180);
};
