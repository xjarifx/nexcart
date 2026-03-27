/**
 * middleware/authorize.middleware.ts
 *
 * `authorize(...roles)` — role-based access control middleware factory.
 * Must be used after `authenticate` (requires `req.user` to be set).
 *
 * Throws 401 if the user is not authenticated.
 * Throws 403 if the user's role is not in the allowed list.
 *
 * Usage:
 *   router.post("/", authenticate, authorize(Role.ADMIN), handler);
 *   router.put("/", authenticate, authorize(Role.ADMIN, Role.CUSTOMER), handler);
 */

import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/enums.js";
import { AppError } from "../types/errors.js";

export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (!roles.includes(req.user.role)) return next(new AppError("Forbidden", 403));
    next();
  };
