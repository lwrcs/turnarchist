// Load environment variables
import "../../src/config";
import { logger } from "../../src/logger";
import { databaseClient } from "../../src/db";
import { gameStatsTable } from "../../src/db/schema";
import fs from "fs";
import path from "path";

const outputFile = "./output/game-stats";

const ensureOutputDir = () => {
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
};

const readFromDatabase = async () => {
  logger.info("Reading game stats from database...");
  const results = await databaseClient.select().from(gameStatsTable);
  logger.info(`Read ${results.length} game stat entries from database`);
  return results;
};

const readAsJson = async () => {
  try {
    const results = await readFromDatabase();
    ensureOutputDir();

    fs.writeFileSync(outputFile + ".json", JSON.stringify(results, null, 2));
    logger.info(`JSON exported to ${outputFile}.json`);
    process.exit(0);
  } catch (error) {
    logger.error("Error reading game stats from database:", error);
    process.exit(1);
  }
};

const convertValue = (value: any): string => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return "null";
  }

  if (typeof value === "object" && Array.isArray(value)) {
    return value.map(convertValue).join(";");
  }

  return String(value);
};

// Helper functions for special field formatting
const formatEnemiesKilled = (enemiesKilled: any): string => {
  if (!Array.isArray(enemiesKilled)) return "null";
  return enemiesKilled.map(String).join(";");
};

const formatSidePathsEntered = (sidePathsEntered: any): string => {
  if (!Array.isArray(sidePathsEntered)) {
    logger.info(
      `sidePathsEntered is not an array: ${JSON.stringify(sidePathsEntered)}`,
    );
    return "null";
  }
  if (sidePathsEntered.length === 0) {
    return "null";
  }
  return sidePathsEntered
    .map((path: any) => `(${path.sidePath};${path.depth})`)
    .join(";");
};

const formatDeviceType = (deviceType: any): string => {
  if (!deviceType || typeof deviceType !== "object") return "null";

  const parts: string[] = [];
  if (deviceType.device?.type) parts.push(deviceType.device.type);
  if (deviceType.browser?.name) parts.push(deviceType.browser.name);
  if (deviceType.os?.name) parts.push(deviceType.os.name);

  return parts.length > 0 ? parts.join(";") : "null";
};

const formatInventory = (inventory: any): string => {
  if (!Array.isArray(inventory)) return "null";
  return inventory
    .map((item: any) => `(${item.name};${item.stackSize})`)
    .join(";");
};

const formatField = (key: string, value: any): string => {
  switch (key) {
    case "enemiesKilled":
      return formatEnemiesKilled(value);
    case "sidePathsEntered":
      return formatSidePathsEntered(value);
    case "deviceType":
      return formatDeviceType(value);
    case "inventory":
      return formatInventory(value);
    default:
      return convertValue(value);
  }
};

const readAsCsv = async () => {
  try {
    const results = await readFromDatabase();
    ensureOutputDir();

    const transformedResults = results.map((result) => {
      const { gameState, ...rest } = result;

      const formatted: Record<string, any> = {};
      for (const [key, value] of Object.entries(rest)) {
        formatted[key] = formatField(key, value);
      }

      return formatted;
    });

    const headers = Object.keys(transformedResults[0]);

    const csvContent = [
      headers.join(","),
      ...transformedResults.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(","),
      ),
    ].join("\n");

    fs.writeFileSync(outputFile + ".csv", csvContent);
    logger.info(`CSV exported to ${outputFile}.csv`);
    process.exit(0);
  } catch (error) {
    logger.error("Error reading game stats from database:", error);
    process.exit(1);
  }
};

const outputFormat = process.env.OUTPUT_FORMAT || "json";

if (outputFormat === "json") {
  readAsJson();
} else if (outputFormat === "csv") {
  readAsCsv();
} else {
  logger.error("Invalid output format:", outputFormat);
  process.exit(1);
}
