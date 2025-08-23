import { databaseClient, PgClient } from "../index";
import { gameStatsTable } from "../schema";
import { GameStatsData, GameStatsEntity } from "./types";
import { desc, getTableColumns, lt, sql } from "drizzle-orm";
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
  }: GameStatsData,
  client: PgClient = databaseClient,
): Promise<GameStatsEntity> => {
  const result = await client
    .insert(gameStatsTable)
    .values({
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
    })
    .returning(getTableColumns(gameStatsTable));

  return extractFirstOrThrow(result);
};

const getGameStats = async (
  {
    limit = 20,
    createdBefore,
  }: {
    limit?: number;
    createdBefore?: string;
  } = {},
  client: PgClient = databaseClient,
): Promise<{
  data: Array<GameStatsEntity>;
  nextCreatedBefore?: string;
}> => {
  // Query for one more than the limit to check if there's a next page
  const baseQuery = client
    .select()
    .from(gameStatsTable)
    .orderBy(desc(gameStatsTable.createdAt))
    .limit(limit + 1);

  const result = createdBefore
    ? await baseQuery.where(
        lt(gameStatsTable.createdAt, new Date(createdBefore).getTime()),
      )
    : await baseQuery;

  // Check if there are more results
  const nextResultAfterPaginationBounds = result[limit];
  const hasNextPage = nextResultAfterPaginationBounds !== undefined;
  const data = hasNextPage ? result.slice(0, limit) : result;

  // Get timestamp for next page
  const nextCreatedBefore = hasNextPage
    ? new Date(nextResultAfterPaginationBounds.createdAt).toISOString()
    : undefined;

  return {
    data,
    nextCreatedBefore,
  };
};

export const gameStatsDal = {
  createGameStats,
  getGameStats,
};
