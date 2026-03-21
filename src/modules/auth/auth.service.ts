import { createUserValidation } from "./auth.validation.js";

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

  try {
    // repository call to create user
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("Internal server error");
  }
};
