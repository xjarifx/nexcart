import { Request, Response } from "express";
import { createUserService } from "./auth.service.js";

export const registerController = async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    await createUserService(email, password, name, phone);
    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
};
