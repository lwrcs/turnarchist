import { varchar, integer, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { standardTimestamps } from "./utils";
import { turnarchistSchema } from "./schema";
import { InventoryItem } from "../../http/schema";
import { sql } from "drizzle-orm";

export const gameStatsTable = turnarchistSchema.table(
  "game_stats",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v1mc()`),
    killedBy: varchar("killed_by", { length: 100 }),
    enemiesKilled: jsonb("enemies_killed").$type<string[]>().notNull(),
    damageDone: integer("damage_done").notNull().default(0),
    damageTaken: integer("damage_taken").notNull().default(0),
    depthReached: integer("depth_reached").notNull().default(0),
    turnsPassed: integer("turns_passed").notNull().default(0),
    coinsCollected: integer("coins_collected").notNull().default(0),
    itemsCollected: integer("items_collected").notNull().default(0),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    gameDurationMs: integer("game_duration_ms").notNull().default(0),
    inventory: jsonb("inventory").$type<Array<InventoryItem>>().notNull(),
    ...standardTimestamps(),
  },
  (table) => ({
    createdAtIdx: index("game_stats_created_at_idx").on(table.createdAt),
  }),
);
