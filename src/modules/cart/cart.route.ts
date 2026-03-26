import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { getCart, addCartItem, updateCartItem, deleteCartItem, clearCart } from "./cart.controller.js";

const cartRouter = Router();

cartRouter.get("/", authenticate, getCart);
cartRouter.post("/items", authenticate, addCartItem);
cartRouter.put("/items/:id", authenticate, updateCartItem);
cartRouter.delete("/items/:id", authenticate, deleteCartItem);
cartRouter.delete("/", authenticate, clearCart);

export default cartRouter;
