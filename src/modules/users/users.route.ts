import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js
import {
  getMe,
  updateMe,
  deleteMe,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
} from "./users.controller.js";

const userRouter = Router();

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
userRouter.get("/me", authenticate, getMe);

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
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
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *       401:
 *         description: Unauthorized
 */
userRouter.put("/me", authenticate, updateMe);

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     tags: [Users]
 *     summary: Delete current user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Account deleted
 *       401:
 *         description: Unauthorized
 */
userRouter.delete("/me", authenticate, deleteMe);

/**
 * @openapi
 * /api/users/me/password:
 *   put:
 *     tags: [Users]
 *     summary: Update current user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       204:
 *         description: Password updated
 *       401:
 *         description: Current password incorrect
 */
userRouter.put("/me/password", authenticate, updatePassword);

/**
 * @openapi
 * /api/users/me/addresses:
 *   get:
 *     tags: [Users]
 *     summary: Get all addresses for current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses
 */
userRouter.get("/me/addresses", authenticate, getAddresses);

/**
 * @openapi
 * /api/users/me/addresses:
 *   post:
 *     tags: [Users]
 *     summary: Add a new address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [addressLine1, city, state, postalCode, country]
 *             properties:
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Address created
 */
userRouter.post("/me/addresses", authenticate, addAddress);

/**
 * @openapi
 * /api/users/me/addresses/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address updated
 *       404:
 *         description: Address not found
 */
userRouter.put("/me/addresses/:id", authenticate, updateAddress);

/**
 * @openapi
 * /api/users/me/addresses/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Address deleted
 *       404:
 *         description: Address not found
 */
userRouter.delete("/me/addresses/:id", authenticate, deleteAddress);

export default userRouter;
