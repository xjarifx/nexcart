/**
 * lib/logger.ts
 *
 * Singleton pino logger instance shared across the entire application.
 * Outputs structured JSON logs in all environments.
 *
 * Log level is controlled via the LOG_LEVEL env var (default: "info").
 * For human-readable output during development, pipe through pino-pretty:
 *   npm run dev:pretty
 */

import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

export default logger;
