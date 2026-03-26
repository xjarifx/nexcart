import { prisma } from "../../lib/prisma.js";

export const findAllCategories = () =>
  prisma.category.findMany({ include: { children: true } });

export const findCategoryBySlug = (slug: string) =>
  prisma.category.findUnique({ where: { slug }, include: { children: true, parent: true } });

export const findCategoryById = (id: string) =>
  prisma.category.findUnique({ where: { id } });

export const findCategoryByName = (name: string) =>
  prisma.category.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });

export const createCategory = (data: { name: string; slug: string; parentId?: string }) =>
  prisma.category.create({ data });

export const updateCategoryById = (id: string, data: { name?: string; slug?: string; parentId?: string }) =>
  prisma.category.update({ where: { id }, data });

export const deleteCategoryById = (id: string) =>
  prisma.category.delete({ where: { id } });
