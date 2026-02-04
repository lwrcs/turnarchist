export type SaveLoadError =
  | { kind: "InvalidJson"; message: string }
  | { kind: "InvalidSchema"; message: string; path?: string }
  | { kind: "UnsupportedVersion"; message: string; saveVersion?: number }
  | { kind: "InvalidState"; message: string }
  | { kind: "MissingReference"; message: string }
  | { kind: "DuplicateGid"; message: string };

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: SaveLoadError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const err = <T = never>(error: SaveLoadError): Result<T> => ({
  ok: false,
  error,
});


