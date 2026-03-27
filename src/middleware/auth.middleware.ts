/**
 * middleware/auth.middleware.ts
 *
 * `authenticate` — verifies the Bearer JWT in the Authorization header,
 * loads the user from the database, and attaches them to `req.user`.
 *
 * Throws 401 if:
 *  - Authorization header is missing or malformed
 *  - Token is invalid or expired
 *  - User no longer exists in the database
 *
 * Apply to any route that requires a logged-in user.
 * For role-based access, chain with `authorize()` from authorize.middleware.ts.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../types/errors.js";
import { findUserById } from "../modules/auth/auth.repository.js";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new AppError("Server misconfiguration", 500);

    // Verify signature and expiry; decoded payload contains { id: userId }
    const decoded = jwt.verify(token, secret) as { id: string };

    // Re-fetch user to ensure they still exist (e.g. account not deleted)
    const user = await findUserById(decoded.id);
    if (!user) throw new AppError("Unauthorized", 401);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Unauthorized", 401));
    }
    next(err);
  }
};
