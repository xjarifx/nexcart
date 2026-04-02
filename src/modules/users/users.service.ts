/**
 * users/users.service.ts
 *
 * Business logic for user profile management and address CRUD.
 * Password is always stripped from responses — never returned to the client.
 */

import bcrypt from "bcryptjs";
import { AppError } from "../../types/errors.js";
import {
  findUserById,
  updateUserById,
  deleteUserById,
  findAddressesByUserId,
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
  const addresses = await findAddressesByUserId(userId);
  return { data: addresses };
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
