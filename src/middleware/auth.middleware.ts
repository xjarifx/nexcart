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
    const decoded = jwt.verify(token, secret) as { id: string };

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
