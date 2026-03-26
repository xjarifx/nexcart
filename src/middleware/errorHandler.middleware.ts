import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../types/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) return next(err);

  // Validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Unknown errors — log and hide details from client
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
};
