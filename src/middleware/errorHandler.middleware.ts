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
  if (res.headersSent) return next(err);

  const body = { success: false, message: "", data: null, meta: {} };

  if (err instanceof ZodError) {
    return res.status(400).json({ ...body, error: err.issues[0]?.message });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ...body, error: err.message });
  }

  logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  res.status(500).json({ ...body, error: "Internal server error" });
};
