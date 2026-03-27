/**
 * shop/shop.controller.ts
 *
 * HTTP layer for shop endpoints.
 * Admin-only actions (approve/suspend/list all) are protected in the route file.
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
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
  respond(res, { status: 201, message: "Shop created", data: result.data });
};

export const getMyShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyShopService(req.user!.id);
  respond(res, { data: result.data });
};

export const updateMyShop = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateShopSchema.parse(req.body);
  const result = await updateMyShopService(req.user!.id, body);
  respond(res, { message: "Shop updated", data: result.data });
};

export const getShopBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getShopBySlugService(req.params.slug);
  respond(res, { data: result.data });
};

export const getAllShops = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getAllShopsService(req.query.status as string | undefined);
  respond(res, { data: result.data });
};

export const approveShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await approveShopService(req.params.id);
  respond(res, { message: "Shop approved", data: result.data });
};

export const suspendShop = async (req: Request, res: Response, next: NextFunction) => {
  const result = await suspendShopService(req.params.id);
  respond(res, { message: "Shop suspended", data: result.data });
};
