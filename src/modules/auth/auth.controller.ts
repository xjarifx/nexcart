import { Request, Response, NextFunction } from "express";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "./auth.validation.js";
import {
  registerService,
  loginService,
  refreshService,
  logoutService,
} from "./auth.service.js";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = registerSchema.parse(req.body);
  const result = await registerService(body);
  res.status(201).json(result);
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginService(email, password);
  res.json(result);
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await refreshService(refreshToken);
  res.json(result);
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  await logoutService(refreshToken);
  res.status(204).send();
};
