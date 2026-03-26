import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  return res.status(500).json({ error: "Internal server error" });
};
