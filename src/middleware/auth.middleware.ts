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
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AppError("Unauthorized", 401);
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new AppError("ACCESS_TOKEN_SECRET is not set", 500);
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    const user = await findUserById(decoded.id);

    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Unauthorized", 401));
    }
    next(error);
  }
};
