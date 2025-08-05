import { Game } from "../game";
import { Level } from "../level/level";
import { Room } from "../room/room";
import { Entity } from "../entity/entity";
import { Item } from "../item/item";
import { Inventory } from "../inventory/inventory";
import { Tile } from "../tile/tile";
import { Projectile } from "../projectile/projectile";
import { Player } from "../player/player";

/**
 * Phase-0 Global State Manager
 *  – Keeps master maps keyed by each object’s `globalId`.
 *  – Provides basic CRUD & snapshot utilities.
 *  – NO side-effects: nothing auto-registers yet.
 *
 * Later phases will:
 *  • Auto-register from constructors.
 *  • Emit events on add/remove.
 *  • Handle incremental dirty-flag tracking.
 */
export class GlobalStateManager {
  private static _instance: GlobalStateManager;

  /* ---------- Master tables ---------- */
  readonly games = new Map<string, Game>();
  readonly levels = new Map<string, Level>();
  readonly rooms = new Map<string, Room>();
  readonly entities = new Map<string, Entity>();
  readonly items = new Map<string, Item>();
  readonly inventories = new Map<string, Inventory>();
  readonly tiles = new Map<string, Tile>();
  readonly projectiles = new Map<string, Projectile>();
  readonly players = new Map<string, Player>();

  private constructor() {}

  /* ---------- Singleton accessor ---------- */
  static get instance(): GlobalStateManager {
    if (!this._instance) this._instance = new GlobalStateManager();
    return this._instance;
  }

  /* ---------- Registration helpers ---------- */
  registerGame(g: Game) {
    this.games.set(g.globalId, g);
  }
  registerLevel(l: Level) {
    this.levels.set(l.globalId, l);
  }
  registerRoom(r: Room) {
    this.rooms.set(r.globalId, r);
  }
  registerEntity(e: Entity) {
    this.entities.set(e.globalId, e);
  }
  registerItem(i: Item) {
    this.items.set(i.globalId, i);
  }
  registerInventory(inv: Inventory) {
    this.inventories.set(inv.globalId, inv);
  }
  registerTile(t: Tile) {
    this.tiles.set(t.globalId, t);
  }
  registerProjectile(p: Projectile) {
    this.projectiles.set(p.globalId, p);
  }
  registerPlayer(pl: Player) {
    this.players.set(pl.globalId, pl);
  }

  /* ---------- Lookup shortcuts ---------- */
  getGame(id: string) {
    return this.games.get(id);
  }
  getLevel(id: string) {
    return this.levels.get(id);
  }
  getRoom(id: string) {
    return this.rooms.get(id);
  }
  getEntity(id: string) {
    return this.entities.get(id);
  }
  getItem(id: string) {
    return this.items.get(id);
  }
  getInventory(id: string) {
    return this.inventories.get(id);
  }
  getTile(id: string) {
    return this.tiles.get(id);
  }
  getProjectile(id: string) {
    return this.projectiles.get(id);
  }
  getPlayer(id: string) {
    return this.players.get(id);
  }

  /* ---------- Hydration / reset ---------- */
  /** Clear every registry map – used before loading a save-file. */
  reset(): void {
    this.games.clear();
    this.levels.clear();
    this.rooms.clear();
    this.entities.clear();
    this.items.clear();
    this.inventories.clear();
    this.tiles.clear();
    this.projectiles.clear();
    this.players.clear();
  }

  /* ---------- Snapshot (naïve JSON) ---------- */
  snapshot(): Record<string, any> {
    // Only structural data for now; transient fields stay out.
    return {
      games: [...this.games.values()].map((g) => ({ id: g.globalId })),
      levels: [...this.levels.values()].map((l) => ({
        id: l.globalId,
        depth: l.depth,
      })),
      rooms: [...this.rooms.values()].map((r) => ({
        id: r.globalId,
        depth: r.depth,
      })),
      entities: [...this.entities.values()].map((e) => ({
        id: e.globalId,
        x: e.x,
        y: e.y,
      })),
      items: [...this.items.values()].map((i) => ({
        id: i.globalId,
        x: i.x,
        y: i.y,
        stack: i.stackCount,
      })),
      inventories: [...this.inventories.values()].map((inv) => ({
        id: inv.globalId,
      })),
      tiles: [...this.tiles.values()].map((t) => ({
        id: t.globalId,
        x: t.x,
        y: t.y,
      })),
      projectiles: [...this.projectiles.values()].map((p) => ({
        id: p.globalId,
        x: p.x,
        y: p.y,
      })),
      players: [...this.players.values()].map((pl) => ({
        id: pl.globalId,
        x: pl.x,
        y: pl.y,
      })),
    };
  }

  /* ---------- Hydration stub (phase-2) ---------- */
  // hydrate(data: any) { /* TODO */ }
}
