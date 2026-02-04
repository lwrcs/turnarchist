## Save/Load Format (V2 target)

This document defines the **target save format** for Witch Roguelike.

The goal is **long-term stability and maintainability**:
- saves should survive refactors and new content
- adding content should be modular (register one serializer)
- loading must be safe (validate schema; no silent fallbacks)
- TypeScript type safety must be preserved end-to-end (no `any` / `as any`)

### Core invariants

- **Explicit versioning**: every save includes `saveVersion`.
- **Stable discriminators**: polymorphic objects use `kind: string` (not numeric enums).
- **Stable IDs**: any object that can be referenced by another object must have a stable `gid: string`.
  - references are stored as `...Gid: string`
  - do **not** reference by array index
- **Regen + delta**: the save is split into:
  - **`worldSpec`**: deterministic generation parameters (seed, RNG state, generator version, etc.)
  - **`delta`**: mutable state layered on top of the generated world (door states, tiles changed, entities/items, etc.)

### Shape (high level)

- `saveVersion`: number
- `meta`: optional debug/build metadata
- `worldSpec`: deterministic generation inputs
- `delta`: state that changes during play

### Compatibility policy

- A loader must accept:
  - the current version (`saveVersion === 2`)
  - older versions via **explicit migrations**
- Unknown versions must fail fast with a clear error.

### Error handling policy

- All JSON is parsed as `unknown`.
- The loader validates the save shape before using it.
- Missing/unknown `kind` entries must be an explicit, typed error (never silently “fallback to coal/barrel/floor”).


