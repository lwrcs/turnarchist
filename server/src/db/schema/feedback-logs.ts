import { varchar, text, uuid, index } from "drizzle-orm/pg-core";
import { standardTimestamps } from "./utils";
import { turnarchistSchema } from "./schema";
import { sql } from "drizzle-orm";

export const feedbackLogsTable = turnarchistSchema.table(
  "feedback_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`uuid_generate_v1mc()`),
    type: varchar("type", { length: 10 }).notNull(), // "bug" | "idea"
    text: text("text").notNull(),
    userId: uuid("user_id"),
    ipAddress: varchar("ip_address", { length: 100 }),
    ...standardTimestamps(),
  },
  (table) => ({
    createdAtIdx: index("feedback_logs_created_at_idx").on(table.createdAt),
    userIdIdx: index("feedback_logs_user_id_idx").on(table.userId),
    typeIdx: index("feedback_logs_type_idx").on(table.type),
  }),
);
