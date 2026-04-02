/**
 * index.ts
 *
 * Application entry point.
 * Imports config first to validate env vars before anything else loads.
 */

import "./config.js"; // must be first — exits if env is invalid
import app from "./app.js";
import { config } from "./config.js";
import logger from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const server = app.listen(config.PORT, () => {
  logger.info(`Server running at http://localhost:${config.PORT}`);
  logger.info(`Swagger docs at http://localhost:${config.PORT}/api-docs`);
});

const shutdown = async (signal: NodeJS.Signals) => {
  logger.info({ signal }, "Received shutdown signal");

  server.close(async (closeErr) => {
    if (closeErr) {
      logger.error({ err: closeErr }, "Error while closing HTTP server");
      process.exit(1);
    }

    try {
      await prisma.$disconnect();
      logger.info("HTTP server closed and Prisma disconnected");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Failed to disconnect Prisma during shutdown");
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
