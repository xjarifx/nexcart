import { Request, Response, NextFunction } from "express";
import { createCategorySchema, updateCategorySchema } from "./category.validation.js";
import {
  getAllCategoriesService,
  getCategoryBySlugService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
} from "./category.service.js";

export const getAllCategories = async (_req: Request, res: Response, next: NextFunction) => {
  const result = await getAllCategoriesService();
  res.json(result);
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const result = await getCategoryBySlugService(req.params.slug);
  res.json(result);
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const body = createCategorySchema.parse(req.body);
  const result = await createCategoryService(body);
  res.status(201).json(result);
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const body = updateCategorySchema.parse(req.body);
  const result = await updateCategoryService(req.params.id, body);
  res.json(result);
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  await deleteCategoryService(req.params.id);
  res.status(204).send();
};
