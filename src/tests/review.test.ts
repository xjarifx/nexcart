import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  request,
  app,
  prisma,
  cleanDb,
  registerAndLogin,
  makeAdmin,
  expectSuccess,
  expectError,
} from "./helpers.js";

let buyerToken: string;
let otherToken: string;
let productId: string;
let reviewId: string;

beforeAll(async () => {
  await cleanDb();

  await registerAndLogin({ email: "admin@example.com" });
  await makeAdmin("admin@example.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "password123",
  });
  const adminToken = adminLogin.body.data.accessToken;

  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Electronics" });
  const categoryId = catRes.body.data.id;

  const seller = await registerAndLogin({ email: "seller@example.com" });
  const shopRes = await request(app)
    .post("/api/shops")
    .set("Authorization", `Bearer ${seller.token}`)
    .send({
      name: "Review Shop",
      description: "Shop for review testing purposes",
    });
  await request(app)
    .put(`/api/admin/shops/${shopRes.body.data.id}/approve`)
    .set("Authorization", `Bearer ${adminToken}`);

  const productRes = await request(app)
    .post("/api/shops/mine/products")
    .set("Authorization", `Bearer ${seller.token}`)
    .send({
      categoryId,
      name: "Reviewable Product",
      description: "A product that can be reviewed by users",
      price: 29.99,
      brand: "Brand",
      stockQuantity: 10,
    });
  productId = productRes.body.data.id;

  const buyer = await registerAndLogin({ email: "buyer@example.com" });
  buyerToken = buyer.token;

  const buyerUser = await prisma.user.findUnique({
    where: { email: "buyer@example.com" },
  });
  const buyerAddress = await prisma.address.create({
    data: {
      userId: buyerUser!.id,
      addressLine1: "123 Buyer Street",
      city: "Dhaka",
      state: "Dhaka",
      postalCode: "1207",
      country: "Bangladesh",
      isDefault: true,
    },
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      userId: buyerUser!.id,
      addressId: buyerAddress.id,
      status: "DELIVERED",
      totalAmount: 29.99,
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: deliveredOrder.id,
      productId,
      shopId: productRes.body.data.shopId,
      quantity: 1,
      priceAtPurchase: 29.99,
    },
  });

  const other = await registerAndLogin({ email: "other@example.com" });
  otherToken = other.token;
});
afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("GET /api/products/:productId/reviews", () => {
  it("returns empty reviews list", async () => {
    const res = await request(app).get(`/api/products/${productId}/reviews`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("returns 404 for unknown product", async () => {
    const res = await request(app).get(
      "/api/products/00000000-0000-0000-0000-000000000000/reviews",
    );
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});

describe("POST /api/products/:productId/reviews", () => {
  it("submits a review", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ rating: 5, comment: "Excellent product, highly recommended!" });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    reviewId = res.body.data.id;
    expect(res.body.data.rating).toBe(5);
  });

  it("rejects duplicate review from same user", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ rating: 3, comment: "Changed my mind about this product" });
    expect(res.status).toBe(409);
    expectError(res.body);
  });

  it("rejects rating out of range", async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/reviews`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ rating: 6, comment: "Too good to be true rating" });
    expect(res.status).toBe(400);
    expectError(res.body);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("rejects deletion by non-owner", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
    expectError(res.body);
  });

  it("deletes own review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});
