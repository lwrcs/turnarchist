// Persistent (cross-session) tracking for first-game-only tutorial hints.
// Uses localStorage directly so the flags survive across save/load cycles and new games.

const KEY = "wr_tutorial_shown";

const load = (): Set<string> => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed as string[]);
  } catch {}
  return new Set();
};

const flush = (shown: Set<string>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(shown)));
  } catch {}
};

export const isTutorialHintShown = (id: string): boolean => {
  return load().has(id);
};

export const markTutorialHintShown = (id: string): void => {
  const shown = load();
  shown.add(id);
  flush(shown);
};
