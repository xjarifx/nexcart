import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getCart, addCartItem, updateCartItem, deleteCartItem, clearCart } from "./cart.controller.js";

const cartRouter = Router();

/**
 * @openapi
 * /api/cart:
 *   get:
 *     tags: [Cart]
 *     summary: Get current user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items
 */
cartRouter.get("/", authenticate, getCart);

/**
 * @openapi
 * /api/cart/items:
 *   post:
 *     tags: [Cart]
 *     summary: Add an item to cart (creates cart if it doesn't exist)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Item added, returns updated cart
 *       400:
 *         description: Product unavailable or insufficient stock
 *       404:
 *         description: Product not found
 */
cartRouter.post("/items", authenticate, addCartItem);

/**
 * @openapi
 * /api/cart/items/{id}:
 *   put:
 *     tags: [Cart]
 *     summary: Update cart item quantity
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
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Updated cart
 *       400:
 *         description: Insufficient stock
 *       403:
 *         description: Item does not belong to your cart
 *       404:
 *         description: Cart item not found
 */
cartRouter.put("/items/:id", authenticate, updateCartItem);

/**
 * @openapi
 * /api/cart/items/{id}:
 *   delete:
 *     tags: [Cart]
 *     summary: Remove an item from cart
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
 *         description: Item removed
 *       403:
 *         description: Item does not belong to your cart
 *       404:
 *         description: Cart item not found
 */
cartRouter.delete("/items/:id", authenticate, deleteCartItem);

/**
 * @openapi
 * /api/cart:
 *   delete:
 *     tags: [Cart]
 *     summary: Clear all items from cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Cart cleared
 */
cartRouter.delete("/", authenticate, clearCart);

export default cartRouter;
