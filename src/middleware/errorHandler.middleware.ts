/**
 * middleware/errorHandler.middleware.ts
 *
 * Global Express error handler — must be registered last in app.ts.
 * Catches all errors forwarded via `next(err)` and maps them to
 * a consistent API error response envelope.
 *
 * Handled error types:
 *  - ZodError     → 400 with the first validation issue message
 *  - AppError     → uses the statusCode and message set at throw site
 *  - Unknown      → 500 "Internal server error" (details logged, not exposed)
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../types/errors.js";
import logger from "../lib/logger.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If headers already sent, delegate to Express default handler
  if (res.headersSent) return next(err);

  const body = { success: false, message: "", data: null, meta: {} };

  // Zod validation failure — return the first failing field's message
  if (err instanceof ZodError) {
    return res.status(400).json({ ...body, error: err.issues[0]?.message });
  }

  // Known application error — use the status code and message from the throw site
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ...body, error: err.message });
  }

  // Unexpected error — log full details server-side, return generic message to client
  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  res.status(500).json({ ...body, error: "Internal server error" });
};
