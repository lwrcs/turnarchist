export type KeyColorName =
  | "blue"
  | "cyan"
  | "green"
  | "red"
  | "purple"
  | "yellow"
  | "orange";

export type KeyColor = { name: KeyColorName; hex: string };

const PALETTE: readonly KeyColor[] = [
  { name: "blue", hex: "#3B6BFF" },
  { name: "cyan", hex: "#00E5FF" },
  { name: "green", hex: "#2EE56B" },
  { name: "red", hex: "#FF3B3B" },
  { name: "purple", hex: "#B14CFF" },
  { name: "yellow", hex: "#FFE84A" },
  { name: "orange", hex: "#FF9B3B" },
] as const;

const mix32 = (x: number): number => {
  // Deterministic 32-bit mix (MurmurHash3 finalizer-ish).
  let v = x >>> 0;
  v ^= v >>> 16;
  v = Math.imul(v, 0x85ebca6b) >>> 0;
  v ^= v >>> 13;
  v = Math.imul(v, 0xc2b2ae35) >>> 0;
  v ^= v >>> 16;
  return v >>> 0;
};

export const getKeyColorForId = (id: number): KeyColor => {
  const n = Number.isFinite(id) ? Math.floor(id) : 0;
  const h = mix32(n);
  const idx = h % PALETTE.length;
  return PALETTE[idx];
};

