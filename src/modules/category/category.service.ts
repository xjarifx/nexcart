import { slugify } from "../../lib/slug.js";
import { AppError } from "../../types/errors.js";
import {
  findAllCategories,
  findCategoryBySlug,
  findCategoryById,
  findCategoryByName,
  createCategory,
  updateCategoryById,
  deleteCategoryById,
} from "./category.repository.js";

export const getAllCategoriesService = async () => {
  const categories = await findAllCategories();
  return { data: categories };
};

export const getCategoryBySlugService = async (slug: string) => {
  const category = await findCategoryBySlug(slug);
  if (!category) throw new AppError("Category not found", 404);
  return { data: category };
};

export const createCategoryService = async (data: { name: string; parentId?: string }) => {
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

export const updateCategoryService = async (id: string, data: { name?: string; parentId?: string }) => {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError("Category not found", 404);

  if (data.parentId) {
    if (data.parentId === id) throw new AppError("Category cannot be its own parent", 400);
    const parent = await findCategoryById(data.parentId);
    if (!parent) throw new AppError("Parent category not found", 404);
  }

  const slug = data.name ? slugify(data.name) : undefined;
  const category = await updateCategoryById(id, { ...data, ...(slug && { slug }) });
  return { data: category };
};

export const deleteCategoryService = async (id: string) => {
  const existing = await findCategoryById(id);
  if (!existing) throw new AppError("Category not found", 404);
  await deleteCategoryById(id);
};
