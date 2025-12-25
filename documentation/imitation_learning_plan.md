## Imitation Learning Plan (Witch Roguelike)

### Goal
Train an agent to play the game by **mimicking human actions** from recorded gameplay (behavior cloning), with an upgrade path to **DAgger** and/or **RL fine-tuning** later.

### Non-goals (initially)
- **No full RL training loop** (PPO/DQN) in the first phase.
- **No vision-from-pixels** unless explicitly desired; start with structured state for speed and determinism.
- **No major gameplay re-architecture**; add small, well-owned hooks around existing input + turn processing.

---

## Phase 0: Define the Learning Interface

### Choose observation representation (what the policy sees)
- **Option A (recommended)**: structured features (JSON/typed object) derived from game state.
- **Option B**: tile-grid tensors (local crop around player, multi-channel encoding).
- **Option C**: pixels (screen capture) + keypress actions (harder, slower, least deterministic).

### Choose action space (what the policy can output)
Start with a small discrete set that maps cleanly to existing input handling:
- **Movement**: up/down/left/right, wait
- **Primary action**: attack/use/interact (depending on current context)
- **Optional later**: inventory navigation, equipment, item targeting, spell selection

### Decide policy cadence
- **Turn-level**: one action per player turn (recommended).
- **Frame-level**: continuous input at 60 FPS (avoid unless necessary).

### Decide the “agent contract”
Define a minimal API for dataset + future automation:
- `reset(seed)` (deterministic episode start)
- `getObservation()` (serializable)
- `applyAction(action)` (one player decision)
- `stepToNextDecision()` (advance sim to next player choice boundary)
- `isTerminal()` and terminal reason (death, win, abort)

---

## Phase 1: Record Human Demonstrations

### What to record per step
Each training example should be a tuple:
- **`obs_t`**: observation at decision time
- **`action_t`**: the action taken by the human
- **`meta_t`**: optional debugging metadata (seed, depth, room id, timestamp, build version, input device)

Optionally also store:
- **`mask_t`**: which actions were legal at time `t` (helps training and evaluation)
- **`aux_t`**: auxiliary labels (e.g., “intended target tile”, “current goal”, “danger score”)

### Where to hook recording
Record at the **single authoritative point** where a player action becomes a committed turn input.
- **Avoid** recording raw keydown streams; record the **resolved game action** (the one that actually gets executed).

### File format
Recommended:
- **JSONL** (one record per line) for streaming write + easy sharding.
- Or **Parquet** later for scale.

Example JSONL schema (illustrative):
- `episode_id`, `t`, `seed`
- `obs`: structured object
- `action`: `{ type: "move", dir: "up" }` or `{ type: "interact" }`
- `legal_actions`: list of action ids (optional)

### Dataset organization
- Split by **episodes**, not by random rows, to avoid leakage:
  - `train/`, `val/`, `test/` as episode shards
- Store a `manifest.json` describing:
  - game version/commit
  - observation schema version
  - action enum version
  - collection settings

### Coverage targets
Track coverage to avoid training a “dungeon floor 0 specialist”:
- Depth distribution
- Room types distribution
- Common failure modes (death causes)
- Item categories encountered
- Boss encounters

---

## Phase 2: Behavior Cloning (Supervised Learning)

### Baseline model (start simple)
Pick the simplest thing that can work:
- **MLP** on structured features
- Or **CNN** on local grid encoding

### Loss
- Standard cross-entropy for discrete action classification.
- If using action masks, compute loss only over legal actions.

### Class imbalance handling
Movement often dominates. Consider:
- **Reweighting** rare actions (interact/use item)
- **Balanced sampling** (per action type)
- **Curriculum**: train movement baseline, then add complex actions

### Evaluation metrics
Offline metrics:
- **Top-1 / Top-k accuracy**
- **Action-type F1** (especially for rare actions)
- **Illegal-action rate** (if no mask, this matters)

Online (simulation) metrics (strongly recommended once you can run episodes):
- **Depth reached**
- **Turns survived**
- **Damage taken**
- **Objective completion rate** (keys, ladder, boss, etc.)

### Common failure to expect: compounding error
Behavior cloning drifts off the data distribution; small mistakes compound.
This is expected and is why DAgger often becomes necessary.

---

## Phase 3: DAgger / Dataset Aggregation (Optional but likely)

### Why
Once the agent makes mistakes, it enters states not present in human demos.
DAgger fixes this by collecting additional labels on **agent-visited states**.

### Process
- Run the current policy to generate trajectories.
- Have a “teacher” provide the correct action:
  - Human-in-the-loop labeling
  - Or heuristics/bots for some action classes
- Append those (obs, teacher_action) to the dataset.

### Practical tactics
- Only label in “interesting” states (danger, inventory decisions, branching paths).
- Use action masks and heuristics to reduce labeling burden.

---

## Phase 4: Deployment in Game

### Inference integration points
- A dev command to toggle agent control (e.g., `agent on/off`)
- A safe “step agent once” command for debugging
- A “play N episodes headless” runner for automated evaluation

### Determinism requirements (critical)
To reproduce and debug:
- Seed everything (worldgen, RNG, loot rolls).
- Ensure the **turn boundary** is deterministic (no frame-time dependence).
- Ensure input processing is deterministic (no reliance on timing events).

---

## Key Design Considerations

### Observation design
- **Partial observability**: do you include fog-of-war info or only what the player knows?
- **Temporal context**: some decisions require memory (recent rooms, last damage source).
  - Options: stack last \(k\) observations or use an RNN.
- **Information leaks**: avoid accidentally including hidden state (enemy intentions, RNG state).

### Action design
- **Legal actions**: encode and export an action mask where possible.
- **Context-sensitive actions**: “interact” may mean multiple things depending on state.
  - Either keep it as one action and let the game resolve, or split into explicit sub-actions later.
- **Targeted actions**: items/spells that need coordinates require either:
  - a two-stage policy (choose action then target), or
  - a unified action space over tiles (bigger, harder).

### Performance
- Headless stepping should run thousands of turns per second if possible.
- Avoid rendering and audio during training/eval.

### Data quality
- Garbage-in/garbage-out: demos must include good play and representative situations.
- Track and filter:
  - AFK time
  - menu fumbling
  - experimental commands/cheats

### Versioning / schema evolution
You will change items/enemies/controls. Plan for:
- `OBS_SCHEMA_VERSION`
- `ACTION_ENUM_VERSION`
- migration scripts or compatibility code

### Safety and debugging
- Add a way to dump a failing episode:
  - seed + action log + minimal state snapshots
- Visualize agent decisions:
  - show chosen action, action probabilities, and why (saliency/feature logging)

### Future: RL fine-tuning (optional)
Once imitation is stable, RL can improve exploration and long-horizon planning.
Key prerequisite: a stable environment API and deterministic stepping (already built in earlier phases).

---

## Suggested Milestones

### Milestone A (1–2 days)
- Record demonstrations of basic movement + combat + doors.
- Train a baseline behavior cloning model (movement + wait + interact).
- Verify it can survive short horizons in a controlled environment.

### Milestone B (next)
- Expand action space to inventory/equipment decisions.
- Add DAgger to reduce compounding error.

### Milestone C (later)
- Add optional RL fine-tuning for depth progression and robustness.


