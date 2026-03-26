import request from "supertest";
import app from "../app.js";
import { prisma } from "../lib/prisma.js";

export { request, app, prisma };

// ─── DB cleanup ───────────────────────────────────────────────────────────────

export const cleanDb = async () => {
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.address.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
};

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const registerUser = async (overrides: Partial<{
  name: string; email: string; password: string; phone: string;
}> = {}) => {
  const data = {
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "password123",
    phone: "01012345678",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(data);
  return { res, credentials: data };
};

export const loginUser = async (email: string, password: string) => {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.data?.accessToken as string;
};

export const registerAndLogin = async (overrides: Partial<{
  name: string; email: string; password: string; phone: string;
}> = {}) => {
  const { credentials } = await registerUser(overrides);
  const token = await loginUser(credentials.email, credentials.password);
  return { token, credentials };
};

export const makeAdmin = async (email: string) => {
  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
};

// ─── Assertion helpers ────────────────────────────────────────────────────────

export const expectSuccess = (body: Record<string, unknown>) => {
  expect(body.success).toBe(true);
  expect(body.error).toBeNull();
};

export const expectError = (body: Record<string, unknown>) => {
  expect(body.success).toBe(false);
  expect(body.error).toBeTruthy();
};
