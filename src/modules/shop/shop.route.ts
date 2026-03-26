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

shopRouter.post("/", authenticate, createShop);
shopRouter.get("/mine", authenticate, getMyShop);
shopRouter.put("/mine", authenticate, updateMyShop);
shopRouter.get("/:slug", getShopBySlug);

export default shopRouter;

// Admin shop routes — mounted separately at /api/admin/shops
export const adminShopRouter = Router();
adminShopRouter.get("/", authenticate, authorize(Role.ADMIN), getAllShops);
adminShopRouter.put("/:id/approve", authenticate, authorize(Role.ADMIN), approveShop);
adminShopRouter.put("/:id/suspend", authenticate, authorize(Role.ADMIN), suspendShop);
