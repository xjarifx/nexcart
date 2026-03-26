import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerAndLogin, makeAdmin, expectSuccess, expectError } from "./helpers.js";

let sellerToken: string;
let adminToken: string;
let categoryId: string;
let productId: string;
let productSlug: string;

beforeAll(async () => {
  await cleanDb();

  // admin — create category
  const admin = await registerAndLogin({ email: "admin@example.com" });
  await makeAdmin("admin@example.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin@example.com", password: "password123",
  });
  adminToken = adminLogin.body.data.accessToken;

  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Electronics" });
  categoryId = catRes.body.data.id;

  // seller — create and activate shop
  const seller = await registerAndLogin({ email: "seller@example.com" });
  sellerToken = seller.token;

  const shopRes = await request(app)
    .post("/api/shops")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ name: "Seller Shop", description: "Best electronics shop around" });
  const shopId = shopRes.body.data.id;

  await request(app)
    .put(`/api/admin/shops/${shopId}/approve`)
    .set("Authorization", `Bearer ${adminToken}`);
});
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("POST /api/shops/mine/products", () => {
  it("creates a product", async () => {
    const res = await request(app)
      .post("/api/shops/mine/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        categoryId,
        name: "Test Laptop",
        description: "A powerful laptop for testing purposes",
        price: 999.99,
        brand: "TestBrand",
        stockQuantity: 10,
      });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    productId = res.body.data.id;
    productSlug = res.body.data.slug;
    expect(res.body.data.slug).toBe("test-laptop");
  });

  it("rejects duplicate product name", async () => {
    const res = await request(app)
      .post("/api/shops/mine/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        categoryId,
        name: "Test Laptop",
        description: "Another laptop description here",
        price: 799.99,
        brand: "OtherBrand",
        stockQuantity: 5,
      });
    expect(res.status).toBe(409);
    expectError(res.body);
  });
});

describe("GET /api/shops/mine/products", () => {
  it("returns seller products", async () => {
    const res = await request(app)
      .get("/api/shops/mine/products")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("GET /api/products (public catalog)", () => {
  it("returns active products", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
  });

  it("filters by search", async () => {
    const res = await request(app).get("/api/products?search=laptop");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("filters by minPrice/maxPrice", async () => {
    const res = await request(app).get("/api/products?minPrice=500&maxPrice=1500");
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("GET /api/products/:slug", () => {
  it("returns product by slug", async () => {
    const res = await request(app).get(`/api/products/${productSlug}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.slug).toBe(productSlug);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await request(app).get("/api/products/does-not-exist");
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});

describe("PUT /api/shops/mine/products/:id", () => {
  it("updates a product", async () => {
    const res = await request(app)
      .put(`/api/shops/mine/products/${productId}`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ price: 899.99 });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Number(res.body.data.price)).toBe(899.99);
  });
});

describe("Inventory", () => {
  it("GET /api/shops/mine/products/:id/inventory — returns inventory", async () => {
    const res = await request(app)
      .get(`/api/shops/mine/products/${productId}/inventory`)
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data).toHaveProperty("stockQuantity");
  });

  it("PUT /api/shops/mine/products/:id/inventory — updates stock", async () => {
    const res = await request(app)
      .put(`/api/shops/mine/products/${productId}/inventory`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ stockQuantity: 50 });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.stockQuantity).toBe(50);
  });
});

describe("DELETE /api/shops/mine/products/:id", () => {
  it("soft-deletes a product", async () => {
    const res = await request(app)
      .delete(`/api/shops/mine/products/${productId}`)
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });

  it("product no longer appears in public catalog", async () => {
    const res = await request(app).get(`/api/products/${productSlug}`);
    expect(res.status).toBe(404);
  });
});
