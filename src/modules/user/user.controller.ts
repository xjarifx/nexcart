import { Request, Response } from "express";
import { getUserService } from "./user.service.js";

export const getUserController = async (req: Request, res: Response) => {
  try {
    const userIdParam = req.params.userId;
    const userId: string = Array.isArray(userIdParam)
      ? userIdParam[0]
      : userIdParam;
    const user = await getUserService(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the user." });
  }
};
