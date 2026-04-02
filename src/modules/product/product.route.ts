import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  updateInventory,
  getPublicProducts,
  getPublicProductBySlug,
} from "./product.controller.js";

// Public product routes — mounted at /api/products
export const productRouter = Router();

/**
 * @openapi
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Browse the public product catalog
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category slug
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *       - in: query
 *         name: shop
 *         schema:
 *           type: string
 *         description: Shop slug
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, name]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of active products from active shops
 */
productRouter.get("/", getPublicProducts);

/**
 * @openapi
 * /api/products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found or unavailable
 */
productRouter.get("/:slug", getPublicProductBySlug);

// Seller product routes — mounted at /api/shops/mine/products
export const sellerProductRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /api/shops/mine/products:
 *   get:
 *     tags: [Products]
 *     summary: Get all products in own shop (includes inactive)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 *       404:
 *         description: No shop found for this user
 */
sellerProductRouter.get("/", authenticate, getMyProducts);

/**
 * @openapi
 * /api/shops/mine/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product in own shop
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name, description, price, brand, stockQuantity]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *                 example: 29.99
 *               brand:
 *                 type: string
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Product created with inventory record
 *       409:
 *         description: Product name already taken
 */
sellerProductRouter.post("/", authenticate, createProduct);

/**
 * @openapi
 * /api/shops/mine/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product in own shop
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
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               brand:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 *       403:
 *         description: Product does not belong to your shop
 *       404:
 *         description: Product not found
 */
sellerProductRouter.put("/:id", authenticate, updateProduct);
sellerProductRouter.patch("/:id", authenticate, updateProduct);

/**
 * @openapi
 * /api/shops/mine/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft-delete a product (sets isActive to false)
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
 *         description: Product deactivated
 *       403:
 *         description: Product does not belong to your shop
 *       404:
 *         description: Product not found
 */
sellerProductRouter.delete("/:id", authenticate, deleteProduct);

/**
 * @openapi
 * /api/shops/mine/products/{id}/inventory:
 *   get:
 *     tags: [Products]
 *     summary: Get inventory for a product
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
 *       200:
 *         description: Inventory record
 *       403:
 *         description: Product does not belong to your shop
 *       404:
 *         description: Product not found
 */
sellerProductRouter.get("/:id/inventory", authenticate, getInventory);

/**
 * @openapi
 * /api/shops/mine/products/{id}/inventory:
 *   put:
 *     tags: [Products]
 *     summary: Update stock quantity for a product
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
 *             required: [stockQuantity]
 *             properties:
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Inventory updated
 *       403:
 *         description: Product does not belong to your shop
 *       404:
 *         description: Product not found
 */
sellerProductRouter.put("/:id/inventory", authenticate, updateInventory);
sellerProductRouter.patch("/:id/inventory", authenticate, updateInventory);
