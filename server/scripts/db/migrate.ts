// Load environment variables
import "../../src/config";
import { logger } from "../../src/logger";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { databaseClient } from "../../src/db";

const applyMigrations = async () => {
  logger.info("Executing migrations...");
  await migrate(databaseClient, {
    migrationsFolder: "./migrations",
    migrationsTable: "__migrations",
    migrationsSchema: "turnarchist",
  });
  logger.info("Finished executing migrations!");
  process.exit(0);
};

applyMigrations();
