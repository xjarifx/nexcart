/**
 * product/product.controller.ts
 *
 * HTTP layer for product endpoints.
 * Split into two sections: seller (authenticated) and public (open).
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import {
  createProductSchema,
  updateProductSchema,
  updateInventorySchema,
  productQuerySchema,
} from "./product.validation.js";
import {
  getMyProductsService,
  createProductService,
  updateProductService,
  deleteProductService,
  getInventoryService,
  updateInventoryService,
  getPublicProductsService,
  getPublicProductBySlugService,
} from "./product.service.js";

// ─── Seller ───────────────────────────────────────────────────────────────────

export const getMyProducts = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getMyProductsService(req.user!.id);
  respond(res, { data: result.data });
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  const body = createProductSchema.parse(req.body);
  const result = await createProductService(req.user!.id, body);
  respond(res, { status: 201, message: "Product created", data: result.data });
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateProductSchema.parse(req.body);
  const result = await updateProductService(req.user!.id, req.params.id as string, body);
  respond(res, { message: "Product updated", data: result.data });
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  await deleteProductService(req.user!.id, req.params.id as string);
  respond(res, { message: "Product deactivated" });
};

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getInventoryService(req.user!.id, req.params.id as string);
  respond(res, { data: result.data });
};

export const updateInventory = async (req: Request, res: Response, next: NextFunction) => {
  const { stockQuantity } = updateInventorySchema.parse(req.body);
  const result = await updateInventoryService(req.user!.id, req.params.id as string, stockQuantity);
  respond(res, { message: "Inventory updated", data: result.data });
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const getPublicProducts = async (req: Request, res: Response, next: NextFunction) => {
  const query = productQuerySchema.parse(req.query);
  const result = await getPublicProductsService(query);
  respond(res, { data: result.data, meta: result.meta });
};

export const getPublicProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getPublicProductBySlugService(req.params.slug as string);
  respond(res, { data: result.data });
};
