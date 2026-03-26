import { Request, Response, NextFunction } from "express";
import { createShopSchema, updateShopSchema } from "./shop.validation.js";
import {
  createShopService,
  getMyShopService,
  updateMyShopService,
  getShopBySlugService,
  getAllShopsService,
  approveShopService,
  suspendShopService,
} from "./shop.service.js";

export const createShop = async (req: Request, res: Response, next: NextFunction) => {
  const body = createShopSchema.parse(req.body);
  const result = await createShopService(req.user!.id, body);
  res.status(201).json(result);
};

export const getMyShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyShopService(req.user!.id);
  res.json(result);
};

export const updateMyShop = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateShopSchema.parse(req.body);
  const result = await updateMyShopService(req.user!.id, body);
  res.json(result);
};

export const getShopBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getShopBySlugService(req.params.slug);
  res.json(result);
};

export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAllShopsService(req.query.status as string | undefined);
  res.json(result);
};

export const approveShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await approveShopService(req.params.id);
  res.json(result);
};

export const suspendShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await suspendShopService(req.params.id);
  res.json(result);
};
