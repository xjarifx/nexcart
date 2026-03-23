import "dotenv/config";
import { createUserValidation } from "./auth.validation.js";
import {
  createUserRepository,
  findUserByEmailRepository,
} from "./auth.repository.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const createUserService = async (
  email: string,
  password: string,
  name: string,
  phone: string,
) => {
  const userData = {
    email,
    password,
    name,
    phone,
  };
  if (!email || !password || !name || !phone) {
    throw new Error("All fields are required");
  }

  const validatedData = createUserValidation.parse(userData);
  if (!validatedData) {
    throw new Error("Validation failed");
  }

  // user exists check
  const isUserExist = await findUserByEmailRepository(validatedData.email);
  if (isUserExist) {
    throw new Error("User already exists");
  }

  try {
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await createUserRepository(
      validatedData.email,
      hashedPassword,
      validatedData.name,
      validatedData.phone,
    );
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Internal server error");
  }
};

export const userLoginService = async (email: string, password: string) => {
  // find user by email
  const user = await findUserByEmailRepository(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // JWT
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  return { user, token };
};
