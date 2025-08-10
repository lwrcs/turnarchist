// Minimal cookie helpers with chunking for larger payloads

const toK = (name: string) => encodeURIComponent(name);
const toV = (value: string) => encodeURIComponent(value);

export const setCookie = (name: string, value: string, maxAgeDays = 180) => {
  try {
    const maxAge = maxAgeDays * 24 * 60 * 60;
    document.cookie = `${toK(name)}=${toV(value)}; path=/; max-age=${maxAge}`;
    // Verify round-trip; if it failed (file:// or blocked), fallback to localStorage
    const rt = getCookie(name);
    if (rt === null) {
      localStorage.setItem(name, value);
    }
  } catch {
    try {
      localStorage.setItem(name, value);
    } catch {}
  }
};

export const getCookie = (name: string): string | null => {
  try {
    const key = toK(name) + "=";
    const parts = document.cookie.split(/;\s*/);
    for (const part of parts) {
      if (part.startsWith(key)) {
        return decodeURIComponent(part.substring(key.length));
      }
    }
  } catch {}
  // Fallback to localStorage
  try {
    const v = localStorage.getItem(name);
    return v === null ? null : v;
  } catch {
    return null;
  }
};

export const deleteCookie = (name: string) => {
  try {
    document.cookie = `${toK(name)}=; path=/; max-age=0`;
  } catch {}
  try {
    localStorage.removeItem(name);
  } catch {}
};

// Chunk large strings across multiple cookies
const CHUNK_SIZE = 3000; // stay well under 4KB after key/attrs

export const setCookieChunks = (
  prefix: string,
  value: string,
  maxAgeDays = 30,
) => {
  // Clear existing chunks first
  const meta = getCookie(`${prefix}_meta`);
  if (meta) {
    const total = parseInt(meta, 10);
    if (Number.isFinite(total)) {
      for (let i = 0; i < total; i++) deleteCookie(`${prefix}_${i}`);
    }
    deleteCookie(`${prefix}_meta`);
  }

  // Write new chunks
  const total = Math.ceil(value.length / CHUNK_SIZE) || 1;
  for (let i = 0; i < total; i++) {
    const slice = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    setCookie(`${prefix}_${i}`, slice, maxAgeDays);
  }
  setCookie(`${prefix}_meta`, String(total), maxAgeDays);
};

export const getCookieChunks = (prefix: string): string | null => {
  const meta = getCookie(`${prefix}_meta`);
  if (!meta) return null;
  const total = parseInt(meta, 10);
  if (!Number.isFinite(total) || total <= 0) return null;
  let out = "";
  for (let i = 0; i < total; i++) {
    const chunk = getCookie(`${prefix}_${i}`);
    if (chunk === null) return null;
    out += chunk;
  }
  return out;
};
