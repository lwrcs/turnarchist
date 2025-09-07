import z from "zod";

const inventoryItemSchema = z.object({
  name: z.string(),
  stackSize: z.number(),
});

const sidePathEnteredSchema = z.object({
  depth: z.number().min(0),
  sidePath: z.string(),
});

const deviceTypeInfoSchema = z.object({
  os: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    platform: z.string().optional(),
  }),
  browser: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    major: z.string().optional(),
  }),
  device: z.object({
    model: z.string().optional(),
    type: z.string().optional(),
    vendor: z.string().optional(),
  }),
  orientation: z.string().optional(),
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
  sidePathsEntered: z.array(sidePathEnteredSchema),
  weaponChoice: z.string().nullable(),
  loadedFromSaveFile: z.boolean(),
  deviceType: deviceTypeInfoSchema,
  gameVersion: z.string(),
  // We leave GameState untyped because it's a complex, nested field. Reference the game version
  // and `src/game/GameState.ts` in the game-client code for the object shape.
  // lint was yelling at me for only having a single input so I added a second z.any()
  gameState: z.record(z.any(), z.any()),
});

export const recordGameStatsRequestSchema = {
  body: gameStatsSchema,
};

export type SidePathEntered = z.infer<typeof sidePathEnteredSchema>;
export type DeviceTypeInfo = z.infer<typeof deviceTypeInfoSchema>;
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
