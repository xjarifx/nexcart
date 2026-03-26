import { Request, Response, NextFunction } from "express";
import { Role } from "../generated/prisma/enums.js";
import { AppError } from "../types/errors.js";

export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Unauthorized", 401));
    if (!roles.includes(req.user.role)) return next(new AppError("Forbidden", 403));
    next();
  };
