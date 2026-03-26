import { prisma } from "../../lib/prisma.js";

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const updateUserById = (
  id: string,
  data: { name?: string; phone?: string; password?: string },
) => prisma.user.update({ where: { id }, data });

export const deleteUserById = (id: string) =>
  prisma.user.delete({ where: { id } });

// ─── Addresses ───────────────────────────────────────────────────────────────

export const findAddressesByUserId = (userId: string) =>
  prisma.address.findMany({ where: { userId } });

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

export const clearDefaultAddresses = (userId: string) =>
  prisma.address.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
