/**
 * auth/auth.service.ts
 *
 * Business logic for authentication.
 *
 * Token strategy:
 *  - Access token  : signed JWT, short-lived (15 min), stateless
 *  - Refresh token : opaque random hex string, stored in DB, 7-day expiry
 *
 * The access token carries only { id: userId } in its payload.
 * The refresh token is looked up in the database on every /refresh call
 * so it can be invalidated server-side (e.g. on logout or compromise).
 */

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

/** Signs a short-lived JWT access token for the given user ID. */
const signAccessToken = (userId: string): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new AppError("ACCESS_TOKEN_SECRET is not set", 500);
  return jwt.sign({ id: userId }, secret, { expiresIn: "15m" });
};

/** Generates a cryptographically random opaque refresh token. */
const generateRefreshToken = () => crypto.randomBytes(64).toString("hex");

// ─────────────────────────────────────────────────────────────────────────────

/** Register a new customer account. Hashes password, strips it from the response. */
export const registerService = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new AppError("Email already in use", 409);

  const hashed = await bcrypt.hash(data.password, 12); // 12 rounds ≈ ~300ms
  const user = await createUser({ ...data, password: hashed });

  const { password: _, ...safeUser } = user; // never return the password hash
  return { data: safeUser };
};

/** Validate credentials and issue both tokens. */
export const loginService = async (email: string, password: string) => {
  const user = await findUserByEmail(email);
  // Use the same error message for both "not found" and "wrong password"
  // to avoid leaking whether an email is registered
  if (!user) throw new AppError("Invalid email or password", 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid email or password", 401);

  const accessToken = signAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await createRefreshToken({ userId: user.id, token: refreshToken, expiresAt });

  const { password: _, ...safeUser } = user;
  return { data: { user: safeUser, accessToken, refreshToken } };
};

/** Exchange a valid refresh token for a new access token. */
export const refreshService = async (token: string) => {
  const stored = await findRefreshToken(token);
  if (!stored) throw new AppError("Invalid refresh token", 401);

  // Check expiry manually (DB-stored expiry, not JWT expiry)
  if (stored.expiresAt < new Date()) {
    await deleteRefreshToken(token); // clean up expired token
    throw new AppError("Refresh token expired", 401);
  }

  const user = await findUserById(stored.userId);
  if (!user) throw new AppError("User not found", 401);

  const accessToken = signAccessToken(user.id);
  return { data: { accessToken } };
};

/** Invalidate a refresh token (logout). The access token remains valid until it expires. */
export const logoutService = async (token: string) => {
  const stored = await findRefreshToken(token);
  if (!stored) throw new AppError("Invalid refresh token", 401);
  await deleteRefreshToken(token);
};
