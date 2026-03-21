import router from "express";
import { loginController, registerController } from "./auth.controller.js";

const authRouter = router.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - phone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 result:
 *                   type: object
 *       400:
 *         description: All fields are required
 *       409:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
authRouter.post("/register", registerController);
authRouter.post("/login", loginController);

export default authRouter;
