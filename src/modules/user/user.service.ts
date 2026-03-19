import { getUserRepository } from "./user.repository.js";

export const getUserService = async (userId: string) => {
  try {
    return await getUserRepository(userId);
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("An error occurred while fetching the user.");
  }
};
