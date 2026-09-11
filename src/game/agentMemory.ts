/** Episode-local knowledge. Hidden combat state must never be refreshed from memory. */
export class AgentMemory {
  private entities = new Map<string, any>();
  private tiles = new Map<string, any>();
  clear() { this.entities.clear(); this.tiles.clear(); }
  remember<T extends {entities: any[]; tiles: any[]}>(roomId: string, view: T): T {
    view.entities = view.entities.map(entity => {
      if (entity.appearance === "identified") {
        this.entities.set(entity.id, {...entity});
        return {...entity, knowledge: "current"};
      }
      const known = this.entities.get(entity.id);
      if (!known) return entity;
      return {...known, ...entity, appearance: "identified", knowledge: "remembered",
        health: null, facing: null,
        combat: {...known.combat, killDamageThreshold: null}};
    });
    view.tiles = view.tiles.map(tile => {
      const key = `${roomId}:${tile.x},${tile.y}`;
      if (tile.appearance === "identified") {
        this.tiles.set(key, {...tile});
        return {...tile, knowledge: "current"};
      }
      const known = this.tiles.get(key);
      if (!known) return tile;
      // Remember geometry without restoring old door locks or trap phases.
      return {...tile, kind: known.kind, solid: tile.solid ?? known.solid,
        isDoor: known.isDoor, exit: known.exit, appearance: "identified",
        knowledge: "remembered"};
    });
    return view;
  }
}
