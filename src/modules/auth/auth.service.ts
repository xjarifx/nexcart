import { createUserValidation } from "./auth.validation.js";
import {
  createUserRepository,
  findUserByEmailRepository,
} from "./auth.repository.js";
import bcrypt from "bcryptjs";

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
