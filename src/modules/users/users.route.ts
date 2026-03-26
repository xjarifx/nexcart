import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
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

userRouter.get("/me", authenticate, getMe);
userRouter.put("/me", authenticate, updateMe);
userRouter.delete("/me", authenticate, deleteMe);

userRouter.put("/me/password", authenticate, updatePassword);

userRouter.get("/me/addresses", authenticate, getAddresses);
userRouter.post("/me/addresses", authenticate, addAddress);
userRouter.put("/me/addresses/:id", authenticate, updateAddress);
userRouter.delete("/me/addresses/:id", authenticate, deleteAddress);

export default userRouter;
