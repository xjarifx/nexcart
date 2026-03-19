import { prisma } from "../../lib/prisma.js";

export const getUserRepository = async (userId: string) => {
  try {
    return await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        Address: true,
        Cart: true,
        Order: true,
        Review: true,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error("An error occurred while fetching the user.");
  }
};
