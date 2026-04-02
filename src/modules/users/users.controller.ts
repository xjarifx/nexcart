/**
 * users/users.controller.ts
 *
 * HTTP layer for user profile and address endpoints.
 * `req.user` is guaranteed to be set by the `authenticate` middleware
 * on all routes in this module.
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import { parsePaginationQuery } from "../../lib/paginate.js";
import {
  updateMeSchema,
  updatePasswordSchema,
  addressSchema,
  adminUpdateRoleSchema,
} from "./users.validation.js";
import {
  getMeService,
  updateMeService,
  deleteMeService,
  updatePasswordService,
  getAddressesPaginatedService,
  addAddressService,
  updateAddressService,
  deleteAddressService,
  getAdminUsersService,
  getAdminUserByIdService,
  updateAdminUserRoleService,
} from "./users.service.js";

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await getMeService(req.user!.id);
  respond(res, { data: result.data });
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = updateMeSchema.parse(req.body);
  const result = await updateMeService(req.user!.id, body);
  respond(res, { message: "Profile updated", data: result.data });
};

export const deleteMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await deleteMeService(req.user!.id);
  respond(res, { message: "Account deleted" });
};

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
  await updatePasswordService(req.user!.id, currentPassword, newPassword);
  respond(res, { message: "Password updated" });
};

export const getAddresses = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const result = await getAddressesPaginatedService(req.user!.id, page, limit);
  respond(res, { data: result.data, meta: result.meta });
};

export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = addressSchema.parse(req.body);
  const result = await addAddressService(req.user!.id, body);
  respond(res, { status: 201, message: "Address added", data: result.data });
};

export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = addressSchema.partial().parse(req.body);
  const result = await updateAddressService(
    req.user!.id,
    req.params.id as string,
    body,
  );
  respond(res, { message: "Address updated", data: result.data });
};

export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await deleteAddressService(req.user!.id, req.params.id as string);
  respond(res, { message: "Address deleted" });
};

export const getAdminUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = parsePaginationQuery({
    page: req.query.page as string | undefined,
    limit: req.query.limit as string | undefined,
  });
  const search = (req.query.search as string | undefined)?.trim() || undefined;
  const result = await getAdminUsersService(page, limit, search);
  respond(res, { data: result.data, meta: result.meta });
};

export const getAdminUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await getAdminUserByIdService(req.params.id as string);
  respond(res, { data: result.data });
};

export const updateAdminUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = adminUpdateRoleSchema.parse(req.body);
  const result = await updateAdminUserRoleService(
    req.params.id as string,
    role,
  );
  respond(res, { message: "User role updated", data: result.data });
};
