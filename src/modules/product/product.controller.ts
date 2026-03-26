import { Request, Response, NextFunction } from "express";
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
  res.json(result);
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  const body = createProductSchema.parse(req.body);
  const result = await createProductService(req.user!.id, body);
  res.status(201).json(result);
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateProductSchema.parse(req.body);
  const result = await updateProductService(req.user!.id, req.params.id, body);
  res.json(result);
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  await deleteProductService(req.user!.id, req.params.id);
  res.status(204).send();
};

export const getInventory = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getInventoryService(req.user!.id, req.params.id);
  res.json(result);
};

export const updateInventory = async (req: Request, res: Response, next: NextFunction) => {
  const { stockQuantity } = updateInventorySchema.parse(req.body);
  const result = await updateInventoryService(req.user!.id, req.params.id, stockQuantity);
  res.json(result);
};

// ─── Public ───────────────────────────────────────────────────────────────────

export const getPublicProducts = async (req: Request, res: Response, next: NextFunction) => {
  const query = productQuerySchema.parse(req.query);
  const result = await getPublicProductsService(query);
  res.json(result);
};

export const getPublicProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getPublicProductBySlugService(req.params.slug);
  res.json(result);
};
