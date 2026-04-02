import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";
import { Role } from "../../generated/prisma/enums.js";
import {
  createShop,
  getMyShop,
  updateMyShop,
  getShopBySlug,
  getAllShops,
  approveShop,
  suspendShop,
} from "./shop.controller.js";

const shopRouter = Router();

/**
 * @openapi
 * /api/shops:
 *   post:
 *     tags: [Shops]
 *     summary: Create a shop
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description]
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Awesome Shop
 *               description:
 *                 type: string
 *                 example: We sell the best products
 *     responses:
 *       201:
 *         description: Shop created with PENDING status
 *       409:
 *         description: User already has a shop or name is taken
 */
shopRouter.post("/", authenticate, createShop);

/**
 * @openapi
 * /api/shops/mine:
 *   get:
 *     tags: [Shops]
 *     summary: Get own shop
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop details
 *       404:
 *         description: No shop found for this user
 */
shopRouter.get("/mine", authenticate, getMyShop);

/**
 * @openapi
 * /api/shops/mine:
 *   put:
 *     tags: [Shops]
 *     summary: Update own shop
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop updated
 *       404:
 *         description: No shop found for this user
 */
shopRouter.put("/mine", authenticate, updateMyShop);
shopRouter.patch("/mine", authenticate, updateMyShop);

/**
 * @openapi
 * /api/shops/{slug}:
 *   get:
 *     tags: [Shops]
 *     summary: Get a public shop profile by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shop profile
 *       404:
 *         description: Shop not found or not active
 */
shopRouter.get("/:slug", getShopBySlug);

export default shopRouter;

// Admin shop routes — mounted separately at /api/admin/shops
export const adminShopRouter = Router();

/**
 * @openapi
 * /api/admin/shops:
 *   get:
 *     tags: [Admin]
 *     summary: List all shops (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, SUSPENDED]
 *         description: Filter by shop status
 *     responses:
 *       200:
 *         description: List of shops
 */
adminShopRouter.get("/", authenticate, authorize(Role.ADMIN), getAllShops);

/**
 * @openapi
 * /api/admin/shops/{id}/approve:
 *   put:
 *     tags: [Admin]
 *     summary: Approve a shop (Admin only)
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
 *         description: Shop approved
 *       404:
 *         description: Shop not found
 */
adminShopRouter.put(
  "/:id/approve",
  authenticate,
  authorize(Role.ADMIN),
  approveShop,
);
adminShopRouter.patch(
  "/:id/approve",
  authenticate,
  authorize(Role.ADMIN),
  approveShop,
);

/**
 * @openapi
 * /api/admin/shops/{id}/suspend:
 *   put:
 *     tags: [Admin]
 *     summary: Suspend a shop (Admin only)
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
 *         description: Shop suspended
 *       404:
 *         description: Shop not found
 */
adminShopRouter.put(
  "/:id/suspend",
  authenticate,
  authorize(Role.ADMIN),
  suspendShop,
);
adminShopRouter.patch(
  "/:id/suspend",
  authenticate,
  authorize(Role.ADMIN),
  suspendShop,
);
