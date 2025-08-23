import axios from "axios";
import type { GameStats as GameStatsType } from "@server/http/schema";
import { getEnvironmentApiUrl } from "./utils";

export const apiClient = axios.create({
  baseURL: getEnvironmentApiUrl(),
});

// The `GameStats` type exported by the server has optional fields by default, because the parent
// project doesnt have `strictNullChecks` enabled. We wrap it in `Required` to make fields non-optional.
type GameStats = Required<GameStatsType>;

export const recordGameStats = async (gameStats: GameStats) => {
  console.log("Recording game stats:", gameStats);
  const response = await apiClient.post("/game/stats", gameStats);
  return response.data;
};

export const safeRecordGameStats = async (gameStats: GameStats) => {
  try {
    return await recordGameStats(gameStats);
  } catch (error) {
    console.error("API request failed:", error);
  }
};

export const fetchGameStats = async () => {
  const response = await apiClient.get("/game/stats");
  return response.data;
};
