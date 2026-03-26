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

categoryRouter.get("/", getAllCategories);
categoryRouter.get("/:slug", getCategoryBySlug);
categoryRouter.post("/", authenticate, authorize(Role.ADMIN), createCategory);
categoryRouter.put("/:id", authenticate, authorize(Role.ADMIN), updateCategory);
categoryRouter.delete("/:id", authenticate, authorize(Role.ADMIN), deleteCategory);

export default categoryRouter;
