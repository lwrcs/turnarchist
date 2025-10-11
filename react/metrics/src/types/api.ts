import { GameStats as ServerGameStats } from "../../../../server/src/http/schema/index";

// Re-export the server GameStats type
export type GameStats = ServerGameStats & {
  createdAt: number;
  updatedAt: number;
};

export interface FilterOptions {
  gameDuration: string;
  coinsCount: string;
  damageDealt: string;
  playerDepth: string;
  weaponChoice: string;
  killedBy: string;
}

// Backend returns raw game sessions
export type ApiResponse = { data: GameStats[] };

// Frontend generates filter options from the data
export interface FilterOptionsData {
  gameDurations: string[];
  coinsCounts: string[];
  damageDealtRanges: string[];
  playerDepths: string[];
  weapons: string[];
  deathCauses: string[];
}

// Aggregated stats for charts
export interface AggregatedStats {
  runsPlayedPerDay: Array<{
    date: string;
    count: number;
  }>;
  runDuration: Array<{
    duration: string;
    count: number;
  }>;
  playerDeaths: Array<{
    cause: string;
    count: number;
  }>;
  playerDepth: Array<{
    depth: number;
    count: number;
  }>;
  weaponChoice: Array<{
    weapon: string;
    count: number;
  }>;
  damageDealt: Array<{
    amount: string;
    count: number;
  }>;
  damageTaken: Array<{
    amount: number;
    count: number;
  }>;
  coinsCollected: Array<{
    amount: string;
    count: number;
  }>;
}
