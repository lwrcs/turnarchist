/* Same-origin hidden-iframe host for privileged deterministic action previews. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentSimulationHost = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const copy = value => JSON.parse(JSON.stringify(value));
  const DIRECTIONS = ["up", "right", "down", "left"];
  const within = (promise, milliseconds, message) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), milliseconds);
    Promise.resolve(promise).then(value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(error); });
  });

  // This is intentionally mechanical.  It converts the game's current
  // operator preview into candidate inputs without deciding which one is best.
  // The normal action processor remains the authority on every candidate.
  function candidateActions(operator) {
    const moves = new Map(((operator?.tactical?.moves) ?? [])
      .filter(move => move && typeof move.direction === "string")
      .map(move => [move.direction, move]));
    return DIRECTIONS.flatMap(direction => {
      const preview = moves.get(direction);
      if (!preview) return [];
      const traversal = preview.traversal ?? {};
      if (preview.resolution === "ladder" && traversal.unlocked === false &&
          traversal.unlockableFromHere !== true) return [];
      // Empty solid walls are not actions.  A wall torch or any other
      // occupant still receives the real interaction attempt.
      if (preview.resolution === "blocked-or-interact" && !preview.occupantId) return [];
      return [{id: `move_${direction}`, action: {type: "Move", direction}, preview: copy(preview)}];
    });
  }

  function rankOutcome(outcome) {
    const delta = outcome.playerDelta ?? {};
    const lostHealth = Math.max(0, -(delta.health ?? 0));
    const noEffect = !outcome.recorded && !delta.positionChanged &&
      !delta.roomChanged && !delta.depthChanged && !(outcome.enemiesKilled ?? []).length &&
      !(outcome.enemiesDamaged ?? []).length;
    // Lexicographic, not weighted: survival is never exchanged for a small
    // navigation gain.  Damage is a cost, not a ban; a forced half-heart line
    // remains eligible when every candidate has a worse outcome.
    return [
      outcome.transition === "death" ? 1 : 0,
      lostHealth,
      outcome.threatsAfter ?? Number.MAX_SAFE_INTEGER,
      noEffect ? 1 : 0,
      -((outcome.enemiesKilled ?? []).length),
      -((outcome.enemiesDamaged ?? []).length),
      delta.depthChanged ? -1 : 0,
      delta.roomChanged ? -1 : 0,
      delta.positionChanged ? -1 : 0,
    ];
  }

  function compareOutcomes(left, right) {
    const a = rankOutcome(left), b = rankOutcome(right);
    for (let index = 0; index < Math.max(a.length, b.length); index++) {
      if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
    }
    return String(left.id ?? left.action?.direction).localeCompare(String(right.id ?? right.action?.direction));
  }

  function summary(action, before, after, result) {
    const enemies = view => new Map((view.room?.entities ?? [])
      .filter(entity => entity.isEnemy && entity.id)
      .map(entity => [entity.id, entity]));
    const beforeEnemies = enemies(before), afterEnemies = enemies(after);
    const enemiesKilled = [...beforeEnemies.keys()].filter(id => !afterEnemies.has(id));
    const enemiesDamaged = [...afterEnemies.entries()]
      .filter(([id, entity]) => {
        const prior = beforeEnemies.get(id);
        return prior && typeof entity.health === 'number' && typeof prior.health === 'number' && entity.health < prior.health;
      }).map(([id]) => id);
    return {
      status: result.terminated ? 'terminated' : result.truncated ? 'truncated' : 'settled',
      action: copy(action),
      playerDelta: {
        health: after.player.health - before.player.health,
        mana: after.player.mana - before.player.mana,
        coins: after.player.coins - before.player.coins,
        turnCount: after.player.turnCount - before.player.turnCount,
        positionChanged: before.player.x !== after.player.x || before.player.y !== after.player.y || before.player.z !== after.player.z,
        roomChanged: before.room.id !== after.room.id,
        depthChanged: before.room.depth !== after.room.depth,
      },
      playerAfter: {x: after.player.x, y: after.player.y, z: after.player.z,
        health: after.player.health, mana: after.player.mana, coins: after.player.coins},
      enemiesKilled,
      enemiesDamaged,
      threatsBefore: (before.room.hitWarnings ?? []).filter(warning => warning.dangerous).length,
      threatsAfter: (after.room.hitWarnings ?? []).filter(warning => warning.dangerous).length,
      transition: result.terminated ? 'death' : before.room.depth !== after.room.depth ? 'floor' :
        before.room.id !== after.room.id ? 'room' : null,
      recorded: result.info?.recorded === true,
      turnDelta: result.info?.turnDelta ?? null,
    };
  }

  class IsolatedSimulator {
    constructor({source, createFrame} = {}) {
      if (typeof source !== 'function') throw new Error('An agent source function is required');
      this.source = source;
      this.createFrame = createFrame ?? (() => {
        const frame = document.createElement('iframe');
        frame.title = 'Hidden deterministic action simulator';
        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        // Keep this frame paintable. Browsers may pause animation frames for a
        // visibility:hidden iframe, which leaves turn resolution stuck after a
        // restored branch performs a real movement action.
        frame.style.cssText = 'position:fixed;left:-200vw;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
        frame.src = './play.html?agent=1&simulator=1';
        document.body.appendChild(frame);
        return frame;
      });
      this.frame = null;
      this.pending = null;
    }

    async agent() {
      if (!this.frame) this.frame = this.createFrame();
      const deadline = Date.now() + 15000;
      while (!this.frame.contentWindow?.agent) {
        if (Date.now() >= deadline) throw new Error('Hidden simulator did not finish loading');
        await new Promise(resolve => setTimeout(resolve, 25));
      }
      const agent = this.frame.contentWindow.agent;
      // A branch preview must settle immediately and independently of the
      // visible lab's speed toggle.
      agent.setFastMode?.(true);
      return agent;
    }

    async simulateFromSnapshot(snapshot, action, liveBefore) {
      const live = this.source();
      const simulator = await this.agent();
      try {
        await within(simulator.restoreSimulationSnapshot(snapshot.serialized), 3000,
          'Simulator restore timed out; branch discarded');
        const before = copy(simulator.observe());
        const result = await within(simulator.step(copy(action)), 3000,
          'Simulator action timed out; branch discarded');
        const after = copy(simulator.observe());
        const liveAfter = copy(live.observe());
        if (JSON.stringify(liveBefore) !== JSON.stringify(liveAfter)) {
          throw new Error('Simulation preview changed the live game; preview discarded');
        }
        return summary(action, before, after, result);
      } catch (error) {
        // AgentEnvironment marks its iframe failed after a timed-out action.
        // Never reuse that poisoned branch for a later preview.
        this.dispose();
        throw error;
      }
    }

    async simulate(action) {
      if (this.pending) throw new Error('Another simulation preview is in progress');
      this.pending = (async () => {
        const live = this.source();
        const liveBefore = copy(live.observe());
        const snapshot = live.captureSimulationSnapshot();
        return this.simulateFromSnapshot(snapshot, action, liveBefore);
      })();
      try { return await this.pending; }
      finally { this.pending = null; }
    }

    async evaluateCandidates(candidates) {
      if (this.pending) throw new Error('Another simulation preview is in progress');
      this.pending = (async () => {
        const live = this.source();
        const liveBefore = copy(live.observe());
        const snapshot = live.captureSimulationSnapshot();
        const results = [];
        for (const candidate of candidates) {
          try {
            results.push({...candidate, outcome: await this.simulateFromSnapshot(snapshot, candidate.action, liveBefore)});
          } catch (error) {
            results.push({...candidate, outcome: {status: 'unsupported', action: copy(candidate.action),
              transition: null, playerDelta: {}, recorded: false,
              error: error && typeof error === 'object' && typeof error.stack === 'string'
                ? error.stack : String(error)}});
          }
        }
        // A branch that did not record the requested action is not a valid
        // simulation outcome.  Never present a silent no-op as a suggestion.
        const settled = results.filter(result => result.outcome.status === 'settled' && result.outcome.recorded);
        const ranked = settled.sort((left, right) => compareOutcomes(left.outcome, right.outcome));
        return {schemaVersion: 1, candidates: results, ranked: ranked.map(result => ({
          id: result.id, action: result.action, preview: result.preview, outcome: result.outcome,
          rank: rankOutcome(result.outcome),
        })), selected: ranked[0] ? {id: ranked[0].id, action: ranked[0].action,
          preview: ranked[0].preview, outcome: ranked[0].outcome, rank: rankOutcome(ranked[0].outcome)} : null};
      })();
      try { return await this.pending; }
      finally { this.pending = null; }
    }

    dispose() {
      this.frame?.remove?.();
      this.frame = null;
    }
  }

  return {IsolatedSimulator, candidateActions, compareOutcomes, rankOutcome, summary};
});
