/**
 * category/category.service.ts
 *
 * Business logic for category management.
 * Categories are hierarchical — a category can have a parent and multiple children.
 * Slugs are auto-generated from the name via `slugify`.
 */

import { slugify } from "../../lib/slug.js";
import { paginate, buildMeta } from "../../lib/paginate.js";
import { AppError } from "../../types/errors.js";
import {
  findAllCategories,
  countCategories,
  findCategoryBySlug,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
} from "./category.repository.js";

export const getAllCategoriesService = async (page: number, limit: number) => {
  const { skip, take } = paginate(page, limit);
  const [categories, total] = await Promise.all([
    findAllCategories(skip, take),
    countCategories(),
  ]);
  return { data: categories, meta: buildMeta(total, page, limit) };
};

export const getCategoryBySlugService = async (slug: string) => {
  const category = await findCategoryBySlug(slug);
  if (!category) throw new AppError("Category not found", 404);
  return { data: category };
};

/**
 * Creates a new category.
 * - Rejects duplicate names (case-insensitive)
 * - Validates that the parent category exists if parentId is provided
 * - Auto-generates a URL slug from the name
 */
export const createCategoryService = async (data: {
  name: string;
  parentId?: string;
}) => {
  const existing = await findCategoryByName(data.name);
  if (existing) throw new AppError("Category name already exists", 409);

  if (data.parentId) {
    const parent = await findCategoryById(data.parentId);
    if (!parent) throw new AppError("Parent category not found", 404);
  }

  const slug = slugify(data.name);
  const category = await createCategory({ ...data, slug });
  return { data: category };
};

/**
 * Updates a category's name and/or parent.
 * - Prevents a category from being set as its own parent
 * - Validates the new parent exists if provided
 * - Regenerates the slug if the name changes
 *
 * NOTE: slug uniqueness on update is not currently checked — see AUDIT.md.
 */
export const updateCategoryService = async (
  id: string,
  data: { name?: string; parentId?: string },
) => {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError("Category not found", 404);

  if (data.parentId) {
    if (data.parentId === id)
      throw new AppError("Category cannot be its own parent", 400);
    const parent = await findCategoryById(data.parentId);
    if (!parent) throw new AppError("Parent category not found", 404);
  }

  const slug = data.name ? slugify(data.name) : undefined;
  if (slug) {
    const conflicting = await findCategoryBySlug(slug);
    if (conflicting && conflicting.id !== id) {
      throw new AppError("Category slug already exists", 409);
    }
  }

  const category = await updateCategoryById(id, {
    ...data,
    ...(slug && { slug }),
  });
  return { data: category };
};

export const deleteCategoryService = async (id: string) => {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError("Category not found", 404);

  if (existing._count.children > 0) {
    throw new AppError("Cannot delete category with child categories", 409);
  }
  if (existing._count.products > 0) {
    throw new AppError("Cannot delete category with products", 409);
  }

  await deleteCategoryById(id);
};
