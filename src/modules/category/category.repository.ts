/**
 * category/category.repository.ts
 *
 * Database access layer for categories.
 * Categories support a self-referential tree (parent → children).
 */

import { prisma } from "../../lib/prisma.js";

/** Returns all categories with their immediate children included. */
export const findAllCategories = () =>
  prisma.category.findMany({ include: { children: true } });

/** Finds a category by slug, including parent and children for full context. */
export const findCategoryBySlug = (slug: string) =>
  prisma.category.findUnique({
    where: { slug },
    include: { children: true, parent: true },
  });

export const findCategoryById = (id: string) =>
  prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { children: true, products: true },
      },
    },
  });

/** Case-insensitive name lookup — used to prevent duplicate category names. */
export const findCategoryByName = (name: string) =>
  prisma.category.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });

export const createCategory = (data: {
  name: string;
  slug: string;
  parentId?: string;
}) => prisma.category.create({ data });

export const updateCategoryById = (
  id: string,
  data: { name?: string; slug?: string; parentId?: string },
) => prisma.category.update({ where: { id }, data });

export const deleteCategoryById = (id: string) =>
  prisma.category.delete({ where: { id } });
