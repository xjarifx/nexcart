import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./category.controller.js";

const categoryRouter = Router();

/**
 * @openapi
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all categories
 *     responses:
 *       200:
 *         description: List of categories with their children
 */
categoryRouter.get("/", getAllCategories);

/**
 * @openapi
 * /api/categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category with parent and children
 *       404:
 *         description: Category not found
 */
categoryRouter.get("/:slug", getCategoryBySlug);

/**
 * @openapi
 * /api/categories:
 *   post:
 *     tags: [Admin]
 *     summary: Create a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               parentId:
 *                 type: string
 *                 format: uuid
 *                 description: Optional parent category ID
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Category name already exists
 */
categoryRouter.post("/", authenticate, authorize(Role.ADMIN), createCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   put:
 *     tags: [Admin]
 *     summary: Update a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
categoryRouter.put("/:id", authenticate, authorize(Role.ADMIN), updateCategory);

/**
 * @openapi
 * /api/categories/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a category (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
categoryRouter.delete("/:id", authenticate, authorize(Role.ADMIN), deleteCategory);

export default categoryRouter;
