import "dotenv/config";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../../types/errors.js";
import {
  createUser,
  createRefreshToken,
  deleteRefreshToken,
  findRefreshToken,
  findUserByEmail,
  findUserById,
} from "./auth.repository.js";

const signAccessToken = (userId: string): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new AppError("ACCESS_TOKEN_SECRET is not set", 500);
  return jwt.sign({ id: userId }, secret, { expiresIn: "15m" });
};

const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

// ─────────────────────────────────────────────────────────────────────────────

export const registerService = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await bcrypt.hash(data.password, 12);
  const user = await createUser({ ...data, password: hashed });

  const { password: _, ...safeUser } = user;
  return { data: safeUser };
};

export const loginService = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw new AppError("Invalid email or password", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid email or password", 401);

  const accessToken = signAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  // const expiresAt = new Date();
  // expiresAt.setDate(expiresAt.getDate() + 7);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await createRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

  const { password: _, ...safeUser } = user;
  return { data: { user: safeUser, accessToken, refreshToken } };
};

export const refreshService = async (token: string) => {
  const stored = await findRefreshToken(token);
  if (!stored) throw new AppError("Invalid refresh token", 401);
  if (stored.expiresAt < new Date()) {
    await deleteRefreshToken(token);
    throw new AppError("Refresh token expired", 401);
  }

  const user = await findUserById(stored.userId);
  if (!user) throw new AppError("User not found", 401);

  const accessToken = signAccessToken(user.id);
  return { data: { accessToken } };
};

export const logoutService = async (token: string) => {
  const stored = await findRefreshToken(token);
  if (!stored) throw new AppError("Invalid refresh token", 401);
  await deleteRefreshToken(token);
};
