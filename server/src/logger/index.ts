import winston from "winston";

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => `${info.timestamp} info: ${info.message}`),
);

export const logger = winston.createLogger({
  level: "info",
  format,
  transports: [new winston.transports.Console()],
});
