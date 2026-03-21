import { prisma } from "../../lib/prisma.js";

export const createUserRepository = async (
  email: string,
  password: string,
  name: string,
  phone: string,
) => {
  // Logic to create a new user in the database
};
