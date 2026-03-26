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
productRouter.get("/", getPublicProducts);
productRouter.get("/:slug", getPublicProductBySlug);

// Seller product routes — mounted at /api/shops/mine/products
export const sellerProductRouter = Router({ mergeParams: true });
sellerProductRouter.get("/", authenticate, getMyProducts);
sellerProductRouter.post("/", authenticate, createProduct);
sellerProductRouter.put("/:id", authenticate, updateProduct);
sellerProductRouter.delete("/:id", authenticate, deleteProduct);
sellerProductRouter.get("/:id/inventory", authenticate, getInventory);
sellerProductRouter.put("/:id/inventory", authenticate, updateInventory);
