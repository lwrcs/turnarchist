import { config } from "./src/config";
import { logger } from "./src/logger";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: `${config.database.url}?options=-c%20search_path=turnarchist`,
  },
} satisfies Config;
