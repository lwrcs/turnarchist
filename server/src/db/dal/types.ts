import { gameStatsTable } from "../schema";

export type GameStatsEntity = typeof gameStatsTable.$inferSelect;

export type GameStatsData = Omit<
  GameStatsEntity,
  "id" | "createdAt" | "updatedAt"
>;
