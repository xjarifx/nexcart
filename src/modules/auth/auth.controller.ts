import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { registerSchema, loginSchema, refreshSchema } from "./auth.validation.js";
import { registerService, loginService, refreshService, logoutService } from "./auth.service.js";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const body = registerSchema.parse(req.body);
  const result = await registerService(body);
  respond(res, { status: 201, message: "User registered successfully", data: result.data });
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = loginSchema.parse(req.body);
  const result = await loginService(email, password);
  respond(res, { message: "Login successful", data: result.data });
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await refreshService(refreshToken);
  respond(res, { message: "Token refreshed", data: result.data });
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  const { refreshToken } = refreshSchema.parse(req.body);
  await logoutService(refreshToken);
  respond(res, { message: "Logged out successfully" });
};
