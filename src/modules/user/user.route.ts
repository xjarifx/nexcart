import { Router } from "express";
import { getUserController } from "./user.controller.js";

const router = Router();

router.get("/:userId", getUserController);

export default router;
