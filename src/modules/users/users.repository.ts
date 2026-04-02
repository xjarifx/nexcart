/**
 * users/users.repository.ts
 *
 * Database access layer for user profiles and addresses.
 * Only raw Prisma queries — no business logic.
 */

import { prisma } from "../../lib/prisma.js";
import { Role } from "../../generated/prisma/enums.js";

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

export const countUserDependencies = async (userId: string) => {
  const [addresses, cartItems, orders, reviews, shop] = await Promise.all([
    prisma.address.count({ where: { userId } }),
    prisma.cartItem.count({ where: { cart: { userId } } }),
    prisma.order.count({ where: { userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.shop.count({ where: { ownerId: userId } }),
  ]);

  return { addresses, cartItems, orders, reviews, shop };
};

export const findUsers = (skip: number, take: number, search?: string) =>
  prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

export const countUsers = (search?: string) =>
  prisma.user.count({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
  });

export const updateUserRoleById = (id: string, role: Role) =>
  prisma.user.update({ where: { id }, data: { role } });

// ─── Addresses ───────────────────────────────────────────────────────────────

export const findAddressesByUserId = (
  userId: string,
  skip: number,
  take: number,
) =>
  prisma.address.findMany({
    where: { userId },
    skip,
    take,
    orderBy: { id: "desc" },
  });

export const countAddressesByUserId = (userId: string) =>
  prisma.address.count({ where: { userId } });

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
