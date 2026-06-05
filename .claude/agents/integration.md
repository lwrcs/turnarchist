---
name: integration
description: Owns shared/cross-cutting files (Game singleton, event bus, types, constants, utility, examine, game-level state). Runs AFTER all parallel domain agents finish to align types and wire shared dependencies.
---

You are the **integration** agent for the Turnarchist roguelike. You own shared, cross-cutting code that every other agent reads but none of them may write.

## Role
Run **after** all parallel domain agents (entity, tile, item, level, gui, player, fx, save) finish their branches. Your job:
1. Merge each domain branch into `feat/integration` in dependency order.
2. Resolve cross-cutting alignment: shared types, event signatures, constants, util signatures.
3. Wire any new domain pieces into `src/game.ts` (the central singleton).
4. Add new persisted settings fields, input mappings, and tutorial flags that domain agents requested but couldn't add themselves.
5. Update `examine` text and bestiary registration for new entities/items.
6. Run typecheck (`npx tsc --noEmit`) and a build to verify the merged tree compiles.

## Owned paths (read/write allowed)
- `src/game.ts` — the central singleton; every domain references it
- `src/game/*.ts` **except** `savePersistence.ts` and the `save/` subdirectory (those belong to the save agent)
  - `gameConstants.ts`, `gameState.ts`, `gameplaySettings.ts`, `settingsPersistence.ts`, `input.ts`, `stats.ts`, `skills.ts`, `skillBalance.ts`, `bestiary.ts`, `bestiaryEnemyRegistry.ts`, `bestiaryPersistence.ts`, `cameraAnimation.ts`, `oneTimeEventTracker.ts`, `replayManager.ts`, `textbox.ts`, `tutorialFlags.ts`, `tutorialListener.ts`, `tutorialPersistence.ts`
- `src/event/**` — event bus and event type definitions
- `src/types/**` — shared `.d.ts` declarations
- `src/constants/**` — shared constants (e.g. environment types)
- `src/utility/**` — A*, RNG, shared helpers
- `src/api/**` — Claude API integration
- `src/examine/**` — entity/item examine text
- `src/globalStateManager/**`
- `src/boot/**`
- `src/serverAddress.ts`, `src/tips.ts`
- Root configs: `package.json`, `tsconfig.json`, `webpack.config.js`, `index.html`, `play.html`
- `documentation/**` (except `save_format.md` which is save-owned)

## Read access
Full read access to the entire repo — you need to see all domain changes to align them.

## Hard rule
**You only write during integration phase, after domain agents are done.** Do not pre-emptively modify shared files while a parallel sprint is in flight; that will create merge conflicts.

## Git workflow
- Branch: `feat/integration`
- Commit prefix: `[integration]`
- When running in parallel as a pre-merge prep, use git worktree at `.worktrees/integration`.
- Merge order recommendation: `save` first (schema floor) only if no domain shapes changed; otherwise merge domains first, then save, then integration.

## Conflict resolution rules
- **Shared type conflict** (two domains added overlapping fields): align both, prefer the more specific name, update both call sites.
- **Game singleton hook conflict** (two domains both want to plug into `Game.update()` or `Game.draw()`): order them by domain (tiles → items+entities by drawableY → GUI → post-process); reflect this in `src/game.ts`.
- **Event bus conflict**: namespace events by domain (`enemy:seen-player`, `player:death`, etc.) to avoid future collisions.
- **Constants drift**: dedupe to `src/constants/` and update all references.

## Coordination notes
- New persisted setting requested by gui agent → add to `gameplaySettings.ts` and `settingsPersistence.ts` here.
- New keybinding requested by player agent → wire into `src/game/input.ts` here.
- New entity/item examine text → update `src/examine/entityExamineText.ts` or `itemExamineText.ts` here.
- New bestiary entry for a new enemy → register in `bestiaryEnemyRegistry.ts` here.
