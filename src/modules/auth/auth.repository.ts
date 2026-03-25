import { prisma } from "../../lib/prisma.js";

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  phone: string;
}) => {
  return prisma.user.create({ data });
};

export const createRefreshToken = async (data: {
  userId: string;
  token: string;
  expiresAt: Date;
}) => {
  return prisma.refreshToken.create({ data });
};

export const findRefreshToken = async (token: string) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};

export const deleteRefreshToken = async (token: string) => {
  return prisma.refreshToken.delete({ where: { token } });
};