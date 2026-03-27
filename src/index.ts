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

app.listen(config.PORT, () => {
  logger.info(`Server running at http://localhost:${config.PORT}`);
  logger.info(`Swagger docs at http://localhost:${config.PORT}/api-docs`);
});
