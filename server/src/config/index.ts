import { config as configure } from "dotenv";
import { getEnvironmentVariableOrThrow } from "./utils";

configure({ path: `.env.${process.env.NODE_ENV ?? "development"}` });

const NODE_ENV = getEnvironmentVariableOrThrow("NODE_ENV");
const isDevelopment = NODE_ENV.startsWith("dev");

export const config = {
  isDevelopment,
  server: {
    port: getEnvironmentVariableOrThrow("PORT"),
  },
  database: {
    url: getEnvironmentVariableOrThrow("DATABASE_URL"),
    enableQueryLogs: isDevelopment,
    sslMode: isDevelopment ? "prefer" : "require",
  },
};
