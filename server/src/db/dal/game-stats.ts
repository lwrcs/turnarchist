import { databaseClient, PgClient } from "../index";
import { gameStatsTable } from "../schema";
import { GameStatsData, GameStatsEntity } from "./types";
import { desc, getTableColumns, lt, count, and, or, eq } from "drizzle-orm";
import { extractFirstOrThrow } from ".";

// Helper function to safely convert string numbers to integers
const safeToInt = (value: any): number => {
  if (typeof value === "number") {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.floor(parsed);
  }
  return 0;
};

const createGameStats = async (
  {
    killedBy,
    enemiesKilled,
    damageDone,
    damageTaken,
    depthReached,
    turnsPassed,
    coinsCollected,
    itemsCollected,
    xp,
    level,
    gameDurationMs,
    inventory,
    deviceType,
    sidePathsEntered,
    weaponChoice,
    gameState,
    gameVersion,
    loadedFromSaveFile,
    ipAddress,
    userId,
  }: GameStatsData,
  client: PgClient = databaseClient,
): Promise<GameStatsEntity> => {
  const result = await client
    .insert(gameStatsTable)
    .values({
      killedBy,
      enemiesKilled,
      damageDone: safeToInt(damageDone),
      damageTaken: safeToInt(damageTaken),
      depthReached: safeToInt(depthReached),
      turnsPassed: safeToInt(turnsPassed),
      coinsCollected: safeToInt(coinsCollected),
      itemsCollected: safeToInt(itemsCollected),
      xp: safeToInt(xp),
      level: safeToInt(level),
      gameDurationMs: safeToInt(gameDurationMs),
      inventory,
      deviceType,
      sidePathsEntered,
      weaponChoice,
      gameState,
      gameVersion,
      loadedFromSaveFile,
      ipAddress,
      userId,
    })
    .returning(getTableColumns(gameStatsTable));

  return extractFirstOrThrow(result);
};

const getGameStatsWithCursor = async (
  cursor: string,
  limit: number,
  client: PgClient,
): Promise<Array<GameStatsEntity>> => {
  const cursorRecord = await client
    .select()
    .from(gameStatsTable)
    .where(eq(gameStatsTable.id, cursor))
    .limit(1);

  if (cursorRecord.length === 0) {
    return [];
  }

  const cursorData = cursorRecord[0]!;

  return await client
    .select()
    .from(gameStatsTable)
    .where(
      or(
        lt(gameStatsTable.createdAt, cursorData.createdAt),
        and(
          eq(gameStatsTable.createdAt, cursorData.createdAt),
          lt(gameStatsTable.id, cursorData.id),
        ),
      ),
    )
    .orderBy(desc(gameStatsTable.createdAt), desc(gameStatsTable.id))
    .limit(limit + 1);
};

const getGameStats = async (
  {
    limit = 20,
    cursor,
  }: {
    limit?: number;
    cursor?: string;
  } = {},
  client: PgClient = databaseClient,
): Promise<{
  data: Array<GameStatsEntity>;
  nextCursor?: string;
}> => {
  // Query for one more than the limit to check if there's a next page
  const baseQuery = client
    .select()
    .from(gameStatsTable)
    .orderBy(desc(gameStatsTable.createdAt), desc(gameStatsTable.id))
    .limit(limit + 1);

  const result = cursor
    ? await getGameStatsWithCursor(cursor, limit, client)
    : await baseQuery;

  // Check if there are more results
  const nextResultAfterPaginationBounds = result[limit];
  const hasNextPage = nextResultAfterPaginationBounds !== undefined;
  const data = hasNextPage ? result.slice(0, limit) : result;

  const nextCursor = hasNextPage
    ? nextResultAfterPaginationBounds.id
    : undefined;

  return {
    data,
    nextCursor,
  };
};

const getGameStatsCount = async (
  client: PgClient = databaseClient,
): Promise<number> => {
  const result = await client.select({ count: count() }).from(gameStatsTable);

  return result[0]?.count ?? 0;
};

export const gameStatsDal = {
  createGameStats,
  getGameStats,
  getGameStatsCount,
};
