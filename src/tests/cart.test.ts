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
let cartItemId: string;
let productId: string;

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
      name: "Cart Test Shop",
      description: "Shop for cart testing purposes",
    });
  const shopId = shopRes.body.data.id;

  await request(app)
    .put(`/api/admin/shops/${shopId}/approve`)
    .set("Authorization", `Bearer ${adminToken}`);

  const productRes = await request(app)
    .post("/api/shops/mine/products")
    .set("Authorization", `Bearer ${seller.token}`)
    .send({
      categoryId,
      name: "Cart Product",
      description: "A product for cart testing purposes",
      price: 49.99,
      brand: "TestBrand",
      stockQuantity: 20,
    });
  productId = productRes.body.data.id;

  const buyer = await registerAndLogin({ email: "buyer@example.com" });
  buyerToken = buyer.token;
});
afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("GET /api/cart", () => {
  it("returns empty cart for new user", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});

describe("POST /api/cart/items", () => {
  it("adds item to cart", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 2 });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    cartItemId = res.body.data.items[0].id;
  });

  it("rejects quantity exceeding stock", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 9999 });
    expect(res.status).toBe(400);
    expectError(res.body);
  });

  it("rejects unknown product", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId: "00000000-0000-0000-0000-000000000000", quantity: 1 });
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});

describe("PUT /api/cart/items/:id", () => {
  it("updates cart item quantity", async () => {
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ quantity: 3 });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});

describe("DELETE /api/cart/items/:id", () => {
  it("removes item from cart", async () => {
    const res = await request(app)
      .delete(`/api/cart/items/${cartItemId}`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});

describe("DELETE /api/cart", () => {
  it("clears the cart", async () => {
    // add item first
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});
