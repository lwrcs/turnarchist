## Migrating the Renderer to WebGL

This document describes how to replace the current Canvas2D rendering path with a modern, batched WebGL pipeline while preserving gameplay logic, visual behavior, and the existing draw ordering. The plan is incremental, guarded by feature flags, and designed to keep the majority of room/entity code unchanged at first.

- Origin and coordinates: Origin is top-left (0,0); X→right, Y→down.
- Keep existing draw ordering semantics: rooms → entities → shade/color/bloom → top layer → UI/Chat.
- Minimize state churn with batching; avoid per-sprite state changes.

### High-level goals

- Maintain game logic and update loop; replace only the render implementation.
- Provide a compatibility shim by rewriting `Game.drawHelper` and leaving `Game.drawTile/Obj/Mob/Item/FX` signatures intact.
- Support lighting, shading, bloom, and post-processing as shader/FBO passes.
- Keep UI and text on Canvas2D initially; migrate later to sprite-fonts.
- Use feature flags to switch paths and allow rollback.

---

## 1) Current pipeline summary (as of now)

- Core entry: `Game.draw(delta)` in `src/game.ts`.
- Layering: `drawRooms` (per-room draw + entities) → `drawRoomShadeAndColor` → `drawTopLayer` → UI/Chat → FPS/version/post-process.
- Helper calls: `Game.drawHelper` invoked by `Game.drawTile`/`drawObj`/`drawMob`/`drawItem`/`drawFX` to composite sprite and shade via Canvas2D.
- Optional features: `SMOOTH_LIGHTING`, `SHADE_INLINE_IN_ENTITY_LAYER`, `COLOR_LAYER_COMPOSITE_OPERATION`, `SHADE_LAYER_COMPOSITE_OPERATION`, `USE_WEBGL_BLUR`, `HIGH_QUALITY_BLUR`, `BLUR_DOWNSAMPLE_FACTOR`.
- Existing WebGL usage: `src/gui/webglBlurRenderer.ts` for separable blur; `src/gui/postProcess.ts` for a simple 2D overlay.

---

## 2) Target WebGL architecture

Create a renderer layer that the game calls, abstracting away GL details:

- `src/renderer/Renderer.ts`

  - Initializes WebGL context on the main canvas used by the game.
  - Manages viewport, projection, and frame orchestration (passes/FBOs).
  - Owns a `SpriteBatch` and texture resources.

- `src/renderer/SpriteBatch.ts`

  - Queues sprites (pos, size, uv, tint/shade, opacity, fadeDir) into a dynamic vertex buffer.
  - Sorts and flushes by texture and pass to minimize binds and draws.
  - Uses instanced rendering when available via ANGLE_instanced_arrays extension; falls back to expanded vertices.

- `src/renderer/TextureAtlas.ts`

  - Wraps atlas textures (`tileset`, `objset`, `mobset`, `itemset`, `fxset`, `fontsheet`).
  - Uploads textures once; handles device lost/recreate.

- `src/renderer/RenderTarget.ts`

  - Wraps FBO+texture pairs for scene, light map, bright-pass, blur passes.

- `src/renderer/shaders/*`
  - Sprite shader (vertex + fragment) with per-sprite tint/shade/opacity and optional directional fade mask.
  - Fullscreen composite shaders for color layer, shade layer, bloom composite.

Key design points:

- Pixel-space orthographic projection with Y-flip in the vertex shader to preserve top-left origin.
- Camera and screen shake are uniforms (view transform), not per-sprite transforms.
- One draw call per texture group per pass (or fewer with atlas consolidation).

---

## 3) Feature flags and compatibility

Add a master flag and keep all existing toggles:

- `GameConstants.USE_WEBGL` (boolean, default false until parity).
- Continue using:
  - `USE_WEBGL_BLUR`, `HIGH_QUALITY_BLUR`, `BLUR_DOWNSAMPLE_FACTOR`
  - `SMOOTH_LIGHTING`, `SHADE_INLINE_IN_ENTITY_LAYER`, `SHADE_ENABLED`
  - `COLOR_LAYER_COMPOSITE_OPERATION`, `SHADE_LAYER_COMPOSITE_OPERATION`, `drawOtherRooms`

Compatibility shim:

- Re-implement `Game.drawHelper` to enqueue sprites into `SpriteBatch` when `USE_WEBGL` is true. Keep `Game.drawTile/Obj/Mob/Item/FX` unchanged (they call `drawHelper`).
- Leave text/UI in Canvas2D initially. The GL renderer writes the scene; then we restore the 2D context for UI overlay.

---

## 4) Phased migration plan

Each phase is shippable behind flags with replay-based QA.

### Phase 0: Scaffolding

- [ ] Add `USE_WEBGL` to `GameConstants` with a chat toggle (e.g., `/webglon`, `/webgloff` or reuse `webgl`)
- [ ] Create `src/renderer/` with skeleton classes: `Renderer`, `SpriteBatch`, `TextureAtlas`, `RenderTarget`.
- [ ] Initialize GL in `Renderer` and clear the backbuffer with a solid color.
- [ ] Wire `Renderer.onResize(width, height)` to `Game.onResize` to update viewport.

### Phase 1: Replace `Game.drawHelper`

- [ ] Implement `Renderer.drawSprite({...})` API (see section 6) and route `Game.drawHelper` to it when `USE_WEBGL`.
- [ ] Implement `SpriteBatch` with a single shader and a single dynamic VBO; group by atlas.
- [ ] Support per-sprite: dst rect, src rect, `shadeColor`, `shadeOpacity`, `fadeDir`. Reproduce current `destination-in` mask by multiplying shade with sampled alpha in the fragment shader.

### Phase 2: Rooms and entities batching

- [ ] Accumulate all room and entity sprites into the batch within each pass. Remove Canvas2D `translate` dependence by using a view matrix uniform.
- [ ] Validate `drawOtherRooms` ordering. Match current sort: rooms filtered by `pathId`, sorted by `roomY + height` where applicable.

### Phase 3: Shade/color layers and smooth lighting

- [ ] Implement dedicated passes:
  - Color layer: emulate existing compositing (`soft-light`, `multiply`, `overlay`) via shader math. If exact Porter-Duff is needed, implement as a separate pass into an FBO and blend in the composite step.
  - Shade layer: per-sprite shading already handled in Phase 1. For `SHADE_INLINE_IN_ENTITY_LAYER = false`, draw shade as a separate mask pass before the color layer.
- [ ] `SMOOTH_LIGHTING` path: generate a light map FBO per room or per frame; in the sprite fragment shader, sample light map to modulate final color.

### Phase 4: Bloom and post-processing

- [ ] Render the scene into FBO A.
- [ ] Bright-pass A → B.
- [ ] Separable blur B ↔ C using your existing blur logic (reuse shader math; integrate or replace `WebGLBlurRenderer`). Respect `HIGH_QUALITY_BLUR` and `BLUR_DOWNSAMPLE_FACTOR`.
- [ ] Composite: Scene + k \* Bloom using additive/screen-like blend in shader.
- [ ] Port `PostProcessor.settings` to the final composite shader as uniforms (opacity, color, blend mode approximations).

### Phase 5: UI and text overlay

- [ ] Keep Canvas2D path for UI/Chat (`Game.fillText`, cursor, menus) over the GL result initially.
- [ ] Later (optional): sprite-font text via `fontsheet` in WebGL, replacing `fillText` and removing Canvas2D entirely.

### Phase 6: Cleanup and defaults

- [ ] Make `USE_WEBGL` default true after parity.
- [ ] Remove dead Canvas2D rendering paths except for UI if still needed.
- [ ] Keep fallback to Canvas2D if WebGL init fails.

---

## 5) Integration points and file-by-file edits

These are the expected edits, not applied automatically. Follow them in order.

### 5.1 `src/game/gameConstants.ts`

- Add:
  - `static USE_WEBGL = false;`
  - Optional toggles: `TOGGLE_USE_WEBGL()`; extend existing `/webgl` command or add new commands.

### 5.2 `src/renderer/Renderer.ts`

- Create a class to:
  - Acquire `WebGLRenderingContext` from the same canvas used by `Game.ctx.canvas`.
  - Set up GL state (disable depth/cull, set blending config later per pass).
  - Create/own `SpriteBatch`, `TextureAtlas` (load atlases from `Game.tileset` etc.), and render targets.
  - API:
    - `beginFrame(width, height, camera, shake)`: set viewport, clear, set view uniforms.
    - `drawSprite(params)`: forward to batch.
    - `endFrame()`: flush batches, run post-process chain, present.

### 5.3 `src/game.ts`

- In constructor `window.addEventListener("load", ...)` or after resources loaded:
  - Instantiate `Renderer` when `GameConstants.USE_WEBGL` is true.
  - In `onResize`, call `renderer.onResize(GameConstants.WIDTH, GameConstants.HEIGHT)`.
- In `draw(delta)`:
  - When in GL mode, replace Canvas2D `clearRect` + black fill with `renderer.beginFrame(...)`.
  - Call all existing room/entity draw methods (they will call `Game.drawTile/Obj/...` → `drawHelper` → `renderer.drawSprite`).
  - Replace shade/color/bloom phases with renderer passes (`renderer.runCompositePasses(...)`).
  - After scene is presented, draw UI/Chat with Canvas2D as today (same `Game.ctx`).

### 5.4 `Game.drawHelper` (in `src/game.ts`)

- Replace Canvas2D compositing path:
  - When `USE_WEBGL` is true, build a sprite description with:
    - texture enum (tileset/objset/mobset/itemset/fxset)
    - src rect (sX, sY, sW, sH) in pixels
    - dst rect (dX, dY, dW, dH) in pixels (already tile-size scaled in callers)
    - shadeColor (rgb), shadeOpacity, fadeDir (left/right/up/down/none)
  - Forward to `renderer.drawSprite`.
  - When false, keep current Canvas2D path (unchanged) for fallback.

### 5.5 Room/entity draw methods

- No change required initially because they already call `Game.drawTile/Obj/...`.
- Ensure they do not rely on `Game.ctx.translate` side-effects; camera transform should be provided by the renderer’s view matrix.

### 5.6 Post-processing

- Migrate `PostProcessor.draw` to a GL composite step or keep its effect by drawing a full-screen quad with configured alpha/color and approximated blend.
- Retain `USE_WEBGL_BLUR` and `HIGH_QUALITY_BLUR` to select between in-shader quality variants.

---

## 6) Renderer API (shim target)

Minimal method called by `Game.drawHelper`:

```ts
drawSprite({
  texture: TextureKind,       // tileset | objset | mobset | itemset | fxset | font
  dstX: number, dstY: number,
  dstW: number, dstH: number,
  srcX: number, srcY: number,
  srcW: number, srcH: number,
  tintRGBA?: [number, number, number, number],
  shadeRGBA?: [number, number, number, number], // shadeColor + shadeOpacity
  fadeDir?: -1 | 0 | 1 | 2 | 3,                 // none | left | right | up | down
  pass?: RenderPass                              // scene/color/shade if needed
})
```

Notes:

- `shadeRGBA` replaces Canvas2D overlay+destination-in; fragment shader multiplies shade by sprite alpha and optional gradient mask.
- `pass` optional if batcher separates passes internally.

---

## 7) Shaders

### 7.1 Sprite shader (core)

- Vertex: position in pixels, uv in atlas space, apply `projection * view` (orthographic pixels; Y-flip in vertex to preserve top-left origin semantics).
- Fragment:
  - Sample atlas texture.
  - Compute shade factor: `shadeOpacity * gradient(fadeDir, uvWithinQuad)`.
  - Final color: `mix(baseColor, shadeColor, shadeFactor)`, where `shadeFactor` is multiplied by sampled alpha.
  - Optionally multiply by a sampled light map texel for `SMOOTH_LIGHTING`.

### 7.2 Composite shaders

- Color layer approximation:
  - `soft-light`, `multiply`, `overlay` approximated via standard shader formulas (close match to Canvas2D operations).
- Bloom pipeline:
  - Bright-pass threshold + separable Gaussian blur (horizontal/vertical).
  - Composite with additive/screen-like blend.

---

## 8) Lighting and shading

Current behavior:

- Shade is applied over sprite bounds with configurable color/opacity, then masked by sprite bounds alpha. Optional gradient fade by direction.

WebGL implementation options:

- Per-sprite (simpler, parity-first):
  - Encode shade color/opacity and fadeDir per-sprite; compute mask in fragment shader and mix with sampled color.
- Light map (for `SMOOTH_LIGHTING`):
  - Render room light contributions to an R8/RGBA FBO.
  - Sample this light map in the sprite shader and multiply base color before shade blend.

`SHADE_INLINE_IN_ENTITY_LAYER`:

- If true, apply per-sprite shading in the entity pass (default and fastest).
- If false, run a shade mask pass before color pass to reproduce legacy layer order.

---

## 9) Post-processing and bloom

Pipeline:

1. Render scene → FBO A.
2. Bright-pass A → FBO B.
3. Blur B ↔ C (H/V; quality via `HIGH_QUALITY_BLUR`). Downsample via `BLUR_DOWNSAMPLE_FACTOR`.
4. Composite: A + k\*B → screen.
5. Optional underwater/fog overlay by drawing a fullscreen quad with `PostProcessor.settings` in the final pass.

You may reuse the logic from `src/gui/webglBlurRenderer.ts` (shaders, downsampling), or fold directly into `Renderer`.

---

## 10) Resize, camera, and screen shake

- `onResize`: update `GameConstants.WIDTH/HEIGHT` as today; call `renderer.onResize(width, height)` to set viewport and projection.
- Camera targeting and smoothing remain in `Game`; pass cameraX/Y and shake values to `renderer.beginFrame` and apply as a view offset uniform.
- Remove reliance on per-call `Game.ctx.translate`; the view transform handles it globally.

---

## 11) Performance guidelines

- Batch by texture and pass; minimize `bindTexture` and `useProgram` calls.
- Use a single dynamic VBO ring buffer for sprite instances; map/write sequentially, flush in large chunks.
- Enable instanced rendering (ANGLE_instanced_arrays) when available; otherwise expand quads into 6 vertices.
- Keep room tiles in a static buffer when the room is unchanged; only update dynamic entities each frame.
- Prefer RGBA8 textures, CLAMP_TO_EDGE, LINEAR filtering; avoid unnecessary `texImage2D` reallocations (use `texSubImage2D`).
- Avoid state changes inside tight loops; configure blend/state per pass.

---

## 12) QA and rollout

- Deterministic visual QA using `ReplayManager`:
  - Record a baseline session; capture frames (or hashes) with Canvas2D.
  - Re-run with `USE_WEBGL` and compare.
- Add chat commands to toggle features at runtime:
  - `/webgl`, `/hq`, `/post`, `/smooth`, `/rooms`, `/inline`, etc.
- Sanity checks per phase:
  - Sprites appear at correct coordinates and sizes; no Y inversion.
  - Camera/Shake behave identically.
  - Shade/Color mixing visually matches; toggle `SHADE_INLINE_IN_ENTITY_LAYER` to compare.
  - Bloom looks similar (allow small differences due to shader math).
- Performance targets:
  - Maintain or improve FPS versus Canvas2D on desktop.
  - Keep mobile stable by lowering blur quality and downsample factors automatically.

---

## 13) Browser support and fallbacks

- WebGL 1 is widely supported; request `webgl` context and fall back to Canvas2D if null.
- Safari quirks: keep `isSafari` detection; WebGL blur is recommended there. Ensure powerPreference and preserveDrawingBuffer defaults are sensible.
- If GL context is lost, implement a lightweight restore path (recreate textures and buffers).

---

## 14) Risks and mitigations

- Exact compositing parity: Canvas2D blend modes differ slightly from shader formulas. Mitigate with visual QA and approximations.
- Overdraw and state churn: design batches carefully; avoid per-sprite binds.
- Mobile thermal throttling: reduce blur quality, lower `SHADE_LEVELS`, and shorten light radius.
- Text rendering: keep Canvas2D initially to reduce scope.

---

## 15) Task checklist (condensed)

- [ ] Add `USE_WEBGL` flag and toggles in `GameConstants` and chat.
- [ ] Implement `Renderer`, `SpriteBatch`, `TextureAtlas`, `RenderTarget` scaffolding.
- [ ] Wire resize and projection; top-left origin via Y-flip in vertex shader.
- [ ] Replace `Game.drawHelper` with `renderer.drawSprite` path.
- [ ] Batch rooms and entities; verify ordering and camera.
- [ ] Implement per-sprite shade and directional fade; validate parity.
- [ ] Implement color/shade layers and `SMOOTH_LIGHTING` with light map.
- [ ] Implement bloom/blur pipeline and final composite; port `PostProcessor`.
- [ ] Keep Canvas2D for UI/text, migrate later if desired.
- [ ] Replay-based QA; make `USE_WEBGL` default true once stable.

---

## 16) Appendix: Useful references in the codebase

- `src/game.ts`: draw loop, camera, `drawRooms`, `drawRoomShadeAndColor`, `drawStartScreen`, `drawChat`, `Game.drawHelper`, `Game.drawTile/Obj/Mob/Item/FX`.
- `src/gui/webglBlurRenderer.ts`: example of GL setup, shaders, downsampling, separable blur.
- `src/gui/postProcess.ts`: overlay effect to port into the final composite pass.
- `src/game/gameConstants.ts`: feature toggles and render constants.

---

With this plan, you can ship incrementally: first swap out `drawHelper` with a batched GL path, keep text/UI in Canvas2D, then add lighting and post-processing, and finally enable WebGL by default after visual and performance parity.
