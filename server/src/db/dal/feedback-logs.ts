import { databaseClient, PgClient } from "../index";
import { feedbackLogsTable } from "../schema";
import { desc, asc, eq, and, count } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm";

export type FeedbackLogEntry = typeof feedbackLogsTable.$inferSelect;
export type FeedbackLogType = "bug" | "idea";
export type FeedbackSortField = "createdAt" | "userId";

const createFeedbackLog = async (
  {
    type,
    text,
    userId,
    ipAddress,
  }: { type: FeedbackLogType; text: string; userId?: string | null; ipAddress?: string | null },
  client: PgClient = databaseClient,
): Promise<FeedbackLogEntry> => {
  const result = await client
    .insert(feedbackLogsTable)
    .values({ type, text, userId: userId ?? null, ipAddress: ipAddress ?? null })
    .returning(getTableColumns(feedbackLogsTable));
  if (!result[0]) throw new Error("Insert returned no rows");
  return result[0];
};

const getFeedbackLogs = async (
  {
    type,
    userId,
    sortBy = "createdAt",
    sortDir = "desc",
    limit = 50,
    offset = 0,
  }: {
    type?: FeedbackLogType;
    userId?: string;
    sortBy?: FeedbackSortField;
    sortDir?: "asc" | "desc";
    limit?: number;
    offset?: number;
  } = {},
  client: PgClient = databaseClient,
): Promise<{ data: FeedbackLogEntry[]; total: number }> => {
  const conditions = [];
  if (type) conditions.push(eq(feedbackLogsTable.type, type));
  if (userId) conditions.push(eq(feedbackLogsTable.userId, userId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderCol =
    sortBy === "userId" ? feedbackLogsTable.userId : feedbackLogsTable.createdAt;
  const order = sortDir === "asc" ? asc(orderCol) : desc(orderCol);

  const [rows, countResult] = await Promise.all([
    client
      .select()
      .from(feedbackLogsTable)
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset),
    client
      .select({ count: count() })
      .from(feedbackLogsTable)
      .where(where),
  ]);

  return { data: rows, total: countResult[0]?.count ?? 0 };
};

export const feedbackLogsDal = { createFeedbackLog, getFeedbackLogs };
