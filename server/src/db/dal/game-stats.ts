import { databaseClient, PgClient } from "../index";
import { gameStatsTable } from "../schema";
import { GameStatsData, GameStatsEntity } from "./types";
import { desc, getTableColumns, lt, count, and, or, eq } from "drizzle-orm";
import { extractFirstOrThrow } from ".";

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
  }: GameStatsData,
  client: PgClient = databaseClient,
): Promise<GameStatsEntity> => {
  const result = await client
    .insert(gameStatsTable)
    .values({
      killedBy,
      enemiesKilled,
      damageDone: Math.floor(damageDone),
      damageTaken: Math.floor(damageTaken),
      depthReached: Math.floor(depthReached),
      turnsPassed: Math.floor(turnsPassed),
      coinsCollected: Math.floor(coinsCollected),
      itemsCollected,
      xp: Math.floor(xp),
      level: Math.floor(level),
      gameDurationMs,
      inventory,
      deviceType,
      sidePathsEntered,
      weaponChoice,
      gameState,
      gameVersion,
      loadedFromSaveFile,
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
