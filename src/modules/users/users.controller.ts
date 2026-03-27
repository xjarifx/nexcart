/**
 * users/users.controller.ts
 *
 * HTTP layer for user profile and address endpoints.
 * `req.user` is guaranteed to be set by the `authenticate` middleware
 * on all routes in this module.
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { updateMeSchema, updatePasswordSchema, addressSchema } from "./users.validation.js";
import {
  updateMeService,
  deleteMeService,
  updatePasswordService,
  getAddressesService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
} from "./users.service.js";

export const getMe = (req: Request, res: Response) => {
  // Strip password hash before sending — never expose it
  const { password: _, ...safeUser } = req.user!;
  respond(res, { data: safeUser });
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateMeSchema.parse(req.body);
  const result = await updateMeService(req.user!.id, body);
  respond(res, { message: "Profile updated", data: result.data });
};

export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  await deleteMeService(req.user!.id);
  respond(res, { message: "Account deleted" });
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
  await updatePasswordService(req.user!.id, currentPassword, newPassword);
  respond(res, { message: "Password updated" });
};

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAddressesService(req.user!.id);
  respond(res, { data: result.data });
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  const body = addressSchema.parse(req.body);
  const result = await addAddressService(req.user!.id, body);
  respond(res, { status: 201, message: "Address added", data: result.data });
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  const body = addressSchema.partial().parse(req.body);
  const result = await updateAddressService(req.user!.id, req.params.id as string, body);
  respond(res, { message: "Address updated", data: result.data });
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  await deleteAddressService(req.user!.id, req.params.id as string);
  respond(res, { message: "Address deleted" });
};
