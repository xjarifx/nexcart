import { Request, Response, NextFunction } from "express";
import {
  updateMeSchema,
  updatePasswordSchema,
  addressSchema,
} from "./users.validation.js";
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
  const { password: _, ...safeUser } = req.user!;
  res.json({ data: safeUser });
};

export const updateMe = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateMeSchema.parse(req.body);
  const result = await updateMeService(req.user!.id, body);
  res.json(result);
};

export const deleteMe = async (req: Request, res: Response, next: NextFunction) => {
  await deleteMeService(req.user!.id);
  res.status(204).send();
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);
  await updatePasswordService(req.user!.id, currentPassword, newPassword);
  res.status(204).send();
};

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAddressesService(req.user!.id);
  res.json(result);
};

export const addAddress = async (req: Request, res: Response, next: NextFunction) => {
  const body = addressSchema.parse(req.body);
  const result = await addAddressService(req.user!.id, body);
  res.status(201).json(result);
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  const body = addressSchema.partial().parse(req.body);
  const result = await updateAddressService(req.user!.id, req.params.id as string, body);
  res.json(result);
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  await deleteAddressService(req.user!.id, req.params.id as string);
  res.status(204).send();
};
