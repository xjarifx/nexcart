import router from "express";
import { loginController, registerController } from "./auth.controller.js";

const authRouter = router.Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);

export default authRouter;
