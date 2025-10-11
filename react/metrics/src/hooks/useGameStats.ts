import useSWR from "swr";
import {
  ApiResponse,
  FilterOptions,
  GameStats,
  FilterOptionsData,
  AggregatedStats,
} from "@/types/api";
import { getEnvironmentApiUrl } from "@/utils/helpers";

const API_BASE_URL = getEnvironmentApiUrl() + "/game/stats";

// Helper function to bucket coins with 10-point intervals up to 50
const bucketCoins = (value: number): string => {
  if (value === 0) return "0";
  if (value <= 10) return "1-10";
  if (value <= 20) return "11-20";
  if (value <= 30) return "21-30";
  if (value <= 40) return "31-40";
  if (value <= 50) return "41-50";
  if (value <= 100) return "51-100";
  if (value <= 200) return "101-200";
  if (value <= 500) return "201-500";
  return "500+";
};

// Helper function to bucket damage into adaptive ranges
const bucketDamage = (value: number): string => {
  if (value === 0) return "0";
  if (value <= 10) return "1-10";
  if (value <= 25) return "11-25";
  if (value <= 50) return "26-50";
  if (value <= 100) return "51-100";
  if (value <= 200) return "101-200";
  if (value <= 500) return "201-500";
  return "500+";
};

// Helper function to check if a value falls within a bucket
const isInBucket = (value: number, bucket: string): boolean => {
  if (bucket === "All") return true;
  if (bucket === "0") return value === 0;
  if (bucket === "500+") return value > 500;

  const [min, max] = bucket.split("-").map(Number);
  return value >= min && value <= max;
};

const fetcher = async (url: string): Promise<ApiResponse> => {
  // Temporarily use mock data instead of API call
  // return delayed(mockData as any, 2000);

  // Original API call (commented out for now)
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch game stats");
  }
  return response.json();
};

const buildApiUrl = (filters: FilterOptions): string => {
  const params = new URLSearchParams();

  // Add all filter parameters
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "All") {
      params.append(key, value);
    }
  });

  // Add a reasonable limit to prevent huge responses
  params.append("limit", "1000");

  return `${API_BASE_URL}?${params.toString()}`;
};

// Helper function to filter sessions based on current filters
const filterSessions = (
  sessions: GameStats[],
  filters: FilterOptions,
): GameStats[] => {
  return sessions.filter((session) => {
    // Game duration filter
    if (filters.gameDuration !== "All") {
      const durationMinutes = session.gameDurationMs / (1000 * 60);
      switch (filters.gameDuration) {
        case "<1min":
          if (durationMinutes >= 1) return false;
          break;
        case "<5min":
          if (durationMinutes >= 5) return false;
          break;
        case "<15min":
          if (durationMinutes >= 15) return false;
          break;
        case "<30min":
          if (durationMinutes >= 30) return false;
          break;
        case "<1hr":
          if (durationMinutes >= 60) return false;
          break;
      }
    }

    // Coins count filter - bucketed ranges
    if (filters.coinsCount !== "All") {
      if (!isInBucket(session.coinsCollected, filters.coinsCount)) return false;
    }

    // Damage dealt filter - bucketed ranges
    if (filters.damageDealt !== "All") {
      if (!isInBucket(session.damageDone, filters.damageDealt)) return false;
    }

    // Player depth filter - exact match
    if (filters.playerDepth !== "All") {
      if (session.depthReached !== parseInt(filters.playerDepth)) return false;
    }

    // Weapon choice filter - use weaponChoice field from GameStats, treat null/empty as "unarmed"
    if (filters.weaponChoice !== "All") {
      const sessionWeapon = session.weaponChoice || "unarmed";
      if (sessionWeapon !== filters.weaponChoice) return false;
    }

    // Killed by filter - handle nullable killedBy
    if (filters.killedBy !== "All") {
      if (session.killedBy !== filters.killedBy) return false;
    }

    return true;
  });
};

// Helper function to generate filter options from all sessions
const generateFilterOptions = (sessions: GameStats[]): FilterOptionsData => {
  const gameDurations = ["All", "<1min", "<5min", "<15min", "<30min", "<1hr"];

  // Fixed bucketing for coins (10-point intervals up to 50)
  const coinsCounts = [
    "All",
    "0",
    "1-10",
    "11-20",
    "21-30",
    "31-40",
    "41-50",
    "51-100",
    "101-200",
    "201-500",
    "500+",
  ];

  // Fixed bucketing for damage dealt (adaptive ranges)
  const damageDealtRanges = [
    "All",
    "0",
    "1-10",
    "11-25",
    "26-50",
    "51-100",
    "101-200",
    "201-500",
    "500+",
  ];

  // Extract unique depth values and sort them
  const uniqueDepths = [...new Set(sessions.map((s) => s.depthReached))].sort(
    (a, b) => a - b,
  );
  const playerDepths = [
    "All",
    ...uniqueDepths.map((depth) => depth.toString()),
  ];

  // Extract unique weapons from weaponChoice field, treat null/empty as "unarmed"
  const weapons = [
    "All",
    ...new Set(sessions.map((s) => s.weaponChoice || "unarmed")),
  ];

  // Extract unique death causes - handle nullable killedBy
  const deathCauses = [
    "All",
    ...new Set(sessions.map((s) => s.killedBy).filter(Boolean) as string[]),
  ];

  return {
    gameDurations,
    coinsCounts,
    damageDealtRanges,
    playerDepths,
    weapons,
    deathCauses,
  };
};

// Helper function to aggregate sessions into stats
const aggregateStats = (sessions: GameStats[]): AggregatedStats => {
  // Group sessions by date using createdAt timestamp
  const runsByDate = sessions.reduce(
    (acc, session) => {
      const date = new Date(session.createdAt).toISOString().split("T")[0]; // YYYY-MM-DD format
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Convert to array and sort by date
  const runsPlayedPerDay = Object.entries(runsByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Run duration distribution - bucketed ranges
  const runDurationRanges = sessions.reduce(
    (acc, session) => {
      const durationMinutes = session.gameDurationMs / (1000 * 60);
      let range = "<1min";
      if (durationMinutes >= 60) range = "1hr+";
      else if (durationMinutes >= 30) range = "30min-1hr";
      else if (durationMinutes >= 15) range = "15-30min";
      else if (durationMinutes >= 5) range = "5-15min";
      else if (durationMinutes >= 1) range = "1-5min";

      acc[range] = (acc[range] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const runDuration = Object.entries(runDurationRanges)
    .map(([range, count]) => ({
      duration: range,
      count: count as number,
    }))
    .sort((a, b) => {
      // Custom sort to handle duration ranges properly
      const getSortValue = (range: string) => {
        switch (range) {
          case "<1min":
            return 0;
          case "1-5min":
            return 1;
          case "5-15min":
            return 2;
          case "15-30min":
            return 3;
          case "30min-1hr":
            return 4;
          case "1hr+":
            return 5;
          default:
            return 999;
        }
      };
      return getSortValue(a.duration) - getSortValue(b.duration);
    });

  // Player deaths by cause - handle nullable killedBy
  const deathsByCause = sessions.reduce(
    (acc, session) => {
      const cause = session.killedBy || "unknown";
      acc[cause] = (acc[cause] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const playerDeaths = Object.entries(deathsByCause)
    .map(([cause, count]) => ({ cause, count: count as number }))
    .sort((a, b) => b.count - a.count);

  // Player depth distribution
  const depthDistribution = sessions.reduce(
    (acc, session) => {
      acc[session.depthReached] = (acc[session.depthReached] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const playerDepth = Object.entries(depthDistribution)
    .map(([depth, count]) => ({
      depth: parseInt(depth),
      count: count as number,
    }))
    .sort((a, b) => a.depth - b.depth);

  // Weapon choice distribution - use weaponChoice field, treat null/empty as "unarmed"
  const weaponCounts = sessions.reduce(
    (acc, session) => {
      const weapon = session.weaponChoice || "unarmed";
      acc[weapon] = (acc[weapon] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const weaponChoice = Object.entries(weaponCounts)
    .map(([weapon, count]) => ({ weapon, count }))
    .sort((a, b) => b.count - a.count);

  // Damage dealt distribution - 5-point buckets
  const damageDealtBuckets = sessions.reduce(
    (acc, session) => {
      const bucket = bucketDamage(session.damageDone);
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const damageDealt = Object.entries(damageDealtBuckets)
    .map(([bucket, count]) => ({
      amount: bucket,
      count: count as number,
    }))
    .sort((a, b) => {
      const getSortValue = (bucket: string) => {
        const [min] = bucket.split("-");
        return parseInt(min);
      };
      return getSortValue(a.amount) - getSortValue(b.amount);
    });

  // Damage taken distribution - individual values
  const damageTakenDistribution = sessions.reduce(
    (acc, session) => {
      acc[session.damageTaken] = (acc[session.damageTaken] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  const damageTaken = Object.entries(damageTakenDistribution)
    .map(([amount, count]) => ({
      amount: parseInt(amount),
      count: count as number,
    }))
    .sort((a, b) => a.amount - b.amount);

  // Coins collected distribution - 10-point buckets
  const coinsBuckets = sessions.reduce(
    (acc, session) => {
      const bucket = bucketCoins(session.coinsCollected);
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const coinsCollected = Object.entries(coinsBuckets)
    .map(([bucket, count]) => ({
      amount: bucket,
      count: count as number,
    }))
    .sort((a, b) => {
      const getSortValue = (bucket: string) => {
        const [min] = bucket.split("-");
        return parseInt(min);
      };
      return getSortValue(a.amount) - getSortValue(b.amount);
    });

  return {
    runsPlayedPerDay,
    runDuration,
    playerDeaths,
    playerDepth,
    weaponChoice,
    damageDealt,
    damageTaken,
    coinsCollected,
  };
};

export const useGameStats = (filters: FilterOptions) => {
  const apiUrl = buildApiUrl(filters);

  const {
    data: rawSessions,
    error,
    isLoading,
    mutate,
  } = useSWR(apiUrl, fetcher, {
    // Cache for 5 minutes
    refreshInterval: 5 * 60 * 1000,
    // Revalidate on focus
    revalidateOnFocus: true,
    // Revalidate on reconnect
    revalidateOnReconnect: true,
    // Don't revalidate on mount if data exists
    revalidateOnMount: true,
    // Keep previous data while loading new data
    keepPreviousData: true,
    // Error retry configuration
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  });

  // Process the raw data
  const processedData = rawSessions
    ? {
        data: aggregateStats(filterSessions(rawSessions.data, filters)),
        filters: generateFilterOptions(rawSessions.data),
      }
    : null;

  return {
    data: processedData,
    error,
    isLoading,
    refetch: mutate,
  };
};
