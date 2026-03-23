import { prisma } from "../../lib/prisma.js";

export const createUserRepository = async (
  email: string,
  password: string,
  name: string,
  phone: string,
) => {
  const user = await prisma.user.create({
    data: {
      email,
      password,
      name,
      phone,
    },
  });
  return user;
};

export const findUserByEmailRepository = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};
