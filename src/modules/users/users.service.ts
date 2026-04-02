/**
 * users/users.service.ts
 *
 * Business logic for user profile management and address CRUD.
 * Password is always stripped from responses — never returned to the client.
 */

import bcrypt from "bcryptjs";
import { Role } from "../../generated/prisma/enums.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { AppError } from "../../types/errors.js";
import {
  findUserById,
  updateUserById,
  deleteUserById,
  countUserDependencies,
  findUsers,
  countUsers,
  updateUserRoleById,
  findAddressesByUserId,
  countAddressesByUserId,
  findAddressById,
  createAddress,
  updateAddressById,
  deleteAddressById,
  clearDefaultAddresses,
} from "./users.repository.js";

// ─── Profile ─────────────────────────────────────────────────────────────────

/** Update name and/or phone. Returns the updated user without the password field. */
export const updateMeService = async (
  userId: string,
  data: { name?: string; phone?: string },
) => {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404);

  const updated = await updateUserById(userId, data);
  const { password: _, ...safeUser } = updated;
  return { data: safeUser };
};

/** Returns the latest profile for the authenticated user. */
export const getMeService = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError("User not found", 404);

  const { password: _, ...safeUser } = user;
  return { data: safeUser };
};

/** Permanently deletes the user account. */
export const deleteMeService = async (userId: string) => {
  const existing = await findUserById(userId);
  if (!existing) throw new AppError("User not found", 404);

  const deps = await countUserDependencies(userId);
  const hasDependencies = Object.values(deps).some((value) => value > 0);
  if (hasDependencies) {
    throw new AppError(
      "Account cannot be deleted because related records exist. Contact support for account deactivation.",
      409,
    );
  }

  await deleteUserById(userId);
};

/** Verifies the current password before hashing and saving the new one. */
export const updatePasswordService = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError("User not found", 404);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", 401);

  const hashed = await bcrypt.hash(newPassword, 12);
  await updateUserById(userId, { password: hashed });
};

// ─── Addresses ───────────────────────────────────────────────────────────────

export const getAddressesService = async (userId: string) => {
  return getAddressesPaginatedService(userId, 1, 20);
};

export const getAddressesPaginatedService = async (
  userId: string,
  page: number,
  limit: number,
) => {
  const { skip, take } = paginate(page, limit);
  const [addresses, total] = await Promise.all([
    findAddressesByUserId(userId, skip, take),
    countAddressesByUserId(userId),
  ]);
  return { data: addresses, meta: buildMeta(total, page, limit) };
};

export const getAdminUsersService = async (
  page: number,
  limit: number,
  search?: string,
) => {
  const { skip, take } = paginate(page, limit);
  const [users, total] = await Promise.all([
    findUsers(skip, take, search),
    countUsers(search),
  ]);
  const safeUsers = users.map(
    ({ password: _password, ...safeUser }) => safeUser,
  );
  return { data: safeUsers, meta: buildMeta(total, page, limit) };
};

export const getAdminUserByIdService = async (id: string) => {
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404);
  const { password: _password, ...safeUser } = user;
  return { data: safeUser };
};

export const updateAdminUserRoleService = async (id: string, role: Role) => {
  const user = await findUserById(id);
  if (!user) throw new AppError("User not found", 404);
  const updated = await updateUserRoleById(id, role);
  const { password: _password, ...safeUser } = updated;
  return { data: safeUser };
};

/**
 * Adds a new address for the user.
 * If `isDefault` is true, all other addresses are unset as default first
 * to ensure only one default address exists at a time.
 */
export const addAddressService = async (
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
) => {
  if (data.isDefault) await clearDefaultAddresses(userId);
  const address = await createAddress(userId, data);
  return { data: address };
};

/**
 * Updates an existing address.
 * Verifies ownership before updating.
 * If `isDefault` is being set to true, clears other defaults first.
 */
export const updateAddressService = async (
  userId: string,
  addressId: string,
  data: {
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    isDefault?: boolean;
  },
) => {
  const existing = await findAddressById(addressId, userId);
  if (!existing) throw new AppError("Address not found", 404);

  if (data.isDefault) await clearDefaultAddresses(userId);
  const address = await updateAddressById(addressId, data);
  return { data: address };
};

/** Deletes an address after verifying it belongs to the requesting user. */
export const deleteAddressService = async (
  userId: string,
  addressId: string,
) => {
  const existing = await findAddressById(addressId, userId);
  if (!existing) throw new AppError("Address not found", 404);
  await deleteAddressById(addressId);
};
