import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "../logger";
import * as postgresTableSchemas from "./schema";
import { config } from "../config";

const postgresConnectionURI = `${config.database.url}?options=-c%20search_path=public,turnarchist`;

const logQuery = (query: string) => {
  if (config.database.enableQueryLogs) {
    logger.debug(`Executed Postgres query: ${query}`, { query });
  }
};

const postgresClient = postgres(postgresConnectionURI, {
  ssl: config.database.sslMode as any,
});

export const databaseClient = drizzle(postgresClient, {
  schema: postgresTableSchemas,
  logger: { logQuery },
});

export type PgClient = PostgresJsDatabase<typeof postgresTableSchemas>;
