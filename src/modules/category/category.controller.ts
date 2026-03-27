/**
 * category/category.controller.ts
 *
 * HTTP layer for category endpoints.
 * Create/update/delete are admin-only (enforced in the route file).
 */

import { Request, Response, NextFunction } from "express";
import { respond } from "../../lib/response.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./category.validation.js";
import {
  getAllCategoriesService,
  getCategoryBySlugService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "./category.service.js";

export const getAllCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await getAllCategoriesService();
  respond(res, { data: result.data });
};

export const getCategoryBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = await getCategoryBySlugService(req.params.slug as string);
  respond(res, { data: result.data });
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = createCategorySchema.parse(req.body);
  const result = await createCategoryService(body);
  respond(res, { status: 201, message: "Category created", data: result.data });
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = updateCategorySchema.parse(req.body);
  const result = await updateCategoryService(req.params.id as string, body);
  respond(res, { message: "Category updated", data: result.data });
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  await deleteCategoryService(req.params.id as string);
  respond(res, { message: "Category deleted" });
};
