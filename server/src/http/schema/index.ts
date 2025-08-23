import z from "zod";

const inventoryItemSchema = z.object({
  name: z.string(),
  stackSize: z.number(),
});

const gameStatsSchema = z.object({
  killedBy: z.string().nullable(),
  enemiesKilled: z.array(z.string()),
  damageDone: z.number().min(0),
  damageTaken: z.number().min(0),
  depthReached: z.number().min(0),
  turnsPassed: z.number().min(0),
  coinsCollected: z.number().min(0),
  itemsCollected: z.number().min(0),
  xp: z.number().min(0),
  level: z.number().min(1),
  gameDurationMs: z.number().min(0),
  inventory: z.array(inventoryItemSchema),
});

export const recordGameStatsRequestSchema = {
  body: gameStatsSchema,
};

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type GameStats = z.infer<typeof gameStatsSchema>;

export const fetchGameStatsRequestQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const fetchGameStatsRequestSchema = {
  query: fetchGameStatsRequestQuerySchema,
};

export type FetchGameStatsParams = z.infer<
  typeof fetchGameStatsRequestQuerySchema
>;
