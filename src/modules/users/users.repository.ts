/**
 * users/users.repository.ts
 *
 * Database access layer for user profiles and addresses.
 * Only raw Prisma queries — no business logic.
 */

import { prisma } from "../../lib/prisma.js";

// ─── Profile ─────────────────────────────────────────────────────────────────

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const updateUserById = (
  id: string,
  data: { name?: string; phone?: string; password?: string },
) => prisma.user.update({ where: { id }, data });

/** Hard-deletes the user. Cascades to addresses, cart, orders, reviews via DB relations. */
export const deleteUserById = (id: string) =>
  prisma.user.delete({ where: { id } });

// ─── Addresses ───────────────────────────────────────────────────────────────

export const findAddressesByUserId = (userId: string) =>
  prisma.address.findMany({ where: { userId } });

/** Finds an address only if it belongs to the given user — prevents cross-user access. */
export const findAddressById = (id: string, userId: string) =>
  prisma.address.findFirst({ where: { id, userId } });

export const createAddress = (
  userId: string,
  data: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  },
) => prisma.address.create({ data: { userId, ...data } });

export const updateAddressById = (
  id: string,
  data: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  },
) => prisma.address.update({ where: { id }, data });

export const deleteAddressById = (id: string) =>
  prisma.address.delete({ where: { id } });

/**
 * Unsets `isDefault` on all of a user's addresses.
 * Called before setting a new default to ensure only one default exists at a time.
 */
export const clearDefaultAddresses = (userId: string) =>
  prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
