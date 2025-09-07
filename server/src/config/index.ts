import { config as configure } from "dotenv";
import {
  getEnvironmentVariableOrDefault,
  getEnvironmentVariableOrThrow,
} from "./utils";

const NODE_ENV = getEnvironmentVariableOrDefault("NODE_ENV", "development");

configure({
  path: `.env.${NODE_ENV}`,
});

const isDevelopment = NODE_ENV.startsWith("dev");

export const config = {
  isDevelopment,
  server: {
    port: getEnvironmentVariableOrDefault("PORT", "3000"),
  },
  database: {
    url: getEnvironmentVariableOrThrow("DATABASE_URL"),
    enableQueryLogs: isDevelopment,
    sslMode: isDevelopment ? "prefer" : "require",
  },
};
