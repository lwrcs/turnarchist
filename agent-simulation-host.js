/* Same-origin hidden-iframe host for privileged deterministic action previews. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AgentSimulationHost = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const copy = value => JSON.parse(JSON.stringify(value));

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
        frame.style.cssText = 'position:fixed;left:-200vw;top:0;width:1px;height:1px;border:0;visibility:hidden';
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
      return this.frame.contentWindow.agent;
    }

    async simulate(action) {
      if (this.pending) throw new Error('Another simulation preview is in progress');
      this.pending = (async () => {
        const live = this.source();
        const liveBefore = copy(live.observe());
        const snapshot = live.captureSimulationSnapshot();
        const simulator = await this.agent();
        await simulator.restoreSimulationSnapshot(snapshot.serialized);
        const before = copy(simulator.observe());
        const result = await simulator.step(copy(action));
        const after = copy(simulator.observe());
        const liveAfter = copy(live.observe());
        if (JSON.stringify(liveBefore) !== JSON.stringify(liveAfter)) {
          throw new Error('Simulation preview changed the live game; preview discarded');
        }
        return summary(action, before, after, result);
      })();
      try { return await this.pending; }
      finally { this.pending = null; }
    }

    dispose() {
      this.frame?.remove?.();
      this.frame = null;
    }
  }

  return {IsolatedSimulator, summary};
});
