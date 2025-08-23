import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

export const standardTimestamp = (name: string) =>
  timestamptzToNumber(name, {
    mode: "date",
    withTimezone: true,
  });

export const standardTimestamps = () => ({
  createdAt: standardTimestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: standardTimestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

export const timestamptzToNumber = customType<{
  data: number;
  driverData: string;
}>({
  dataType() {
    return "timestamptz";
  },
  fromDriver(value: string): number {
    return new Date(value).getTime();
  },
  toDriver(value: number): string {
    return new Date(value).toISOString();
  },
});
