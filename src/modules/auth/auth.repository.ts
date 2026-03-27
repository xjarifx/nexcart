/**
 * auth/auth.repository.ts
 *
 * Database access layer for authentication.
 * Only raw Prisma queries live here — no business logic.
 */

import { prisma } from "../../lib/prisma.js";

/** Look up a user by email (used during login and duplicate-check on register). */
export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

/** Look up a user by their primary key (used by the auth middleware on every request). */
export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

/** Insert a new user row. Password must already be hashed before calling this. */
export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  return prisma.user.create({ data });
};

/** Persist a new opaque refresh token tied to a user. */
export const createRefreshToken = async (data: {
  userId: string;
  token: string;
  expiresAt: Date;
}) => {
  return prisma.refreshToken.create({ data });
};

/** Find a refresh token record by its token string (used on refresh and logout). */
export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};

/** Delete a refresh token — called on logout or when the token has expired. */
export const deleteRefreshToken = async (token: string) => {
  return prisma.refreshToken.delete({ where: { token } });
};
